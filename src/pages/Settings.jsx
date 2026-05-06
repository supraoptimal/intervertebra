import { useEffect, useRef, useState } from 'react';
import { PHASES } from '../data/erasItems.js';
import {
  deleteItem,
  deleteProcedure,
  exportAll,
  importAll,
  listItems,
  listPatients,
  listProcedures,
  putItem,
  putProcedure,
  reorderItems,
  resetAll,
} from '../lib/db.js';
import { downloadFile, patientsLongCsv, patientsWideCsv } from '../lib/csv.js';

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export default function Settings() {
  const [items, setItems] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [editing, setEditing] = useState(null); // item id being edited
  const [draft, setDraft] = useState(null);
  const [newProc, setNewProc] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addDraft, setAddDraft] = useState({
    shortLabel: '',
    description: '',
    phase: 'preoperative',
  });
  const [importError, setImportError] = useState('');
  const fileRef = useRef();

  const refresh = () => {
    listItems().then(setItems);
    listProcedures().then(setProcedures);
  };
  useEffect(refresh, []);

  const startEdit = (item) => {
    setEditing(item.id);
    setDraft({ ...item });
  };

  const saveEdit = async () => {
    await putItem(draft);
    setEditing(null);
    setDraft(null);
    refresh();
  };

  const removeItem = async (id) => {
    if (!window.confirm('Delete this item permanently? Disabling is usually safer.')) return;
    await deleteItem(id);
    refresh();
  };

  const move = async (idx, dir) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    await reorderItems(next.map((i) => i.id));
    refresh();
  };

  const addItem = async () => {
    if (!addDraft.shortLabel) return;
    const id = `custom-${slugify(addDraft.shortLabel)}-${Date.now().toString(36)}`;
    await putItem({
      id,
      shortLabel: addDraft.shortLabel,
      description: addDraft.description,
      phase: addDraft.phase,
      evidenceLevel: 'moderate',
      order: items.length,
      disabled: false,
    });
    setShowAdd(false);
    setAddDraft({ shortLabel: '', description: '', phase: 'preoperative' });
    refresh();
  };

  const addProc = async () => {
    if (!newProc.trim()) return;
    await putProcedure(newProc.trim());
    setNewProc('');
    refresh();
  };

  const removeProc = async (name) => {
    await deleteProcedure(name);
    refresh();
  };

  const onExportJson = async () => {
    const data = await exportAll();
    downloadFile(
      `inter-vertebra-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify(data, null, 2),
      'application/json'
    );
  };

  const onExportWideCsv = async () => {
    const [ps, is] = await Promise.all([listPatients(), listItems()]);
    const active = is.filter((i) => !i.disabled);
    downloadFile(
      `inter-vertebra-patients-wide-${new Date().toISOString().slice(0, 10)}.csv`,
      patientsWideCsv(ps, active),
      'text/csv'
    );
  };

  const onExportLongCsv = async () => {
    const [ps, is] = await Promise.all([listPatients(), listItems()]);
    const active = is.filter((i) => !i.disabled);
    downloadFile(
      `inter-vertebra-items-long-${new Date().toISOString().slice(0, 10)}.csv`,
      patientsLongCsv(ps, active),
      'text/csv'
    );
  };

  const onImportClick = () => fileRef.current?.click();

  const onImportFile = async (e) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (
        !window.confirm(
          'Importing will replace ALL existing patients, items, and procedures with the contents of the backup. Continue?'
        )
      ) {
        e.target.value = '';
        return;
      }
      await importAll(data);
      refresh();
      window.alert('Import complete.');
    } catch (err) {
      setImportError(err.message || 'Failed to import.');
    } finally {
      e.target.value = '';
    }
  };

  const onReset = async () => {
    if (!window.confirm('Reset ALL data? This deletes every patient record. The 22 default items and procedure list will be re-seeded.')) return;
    if (!window.confirm('Are you absolutely sure? This is irreversible.')) return;
    await resetAll();
    refresh();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>

      {/* ERAS items */}
      <section className="card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">ERAS items</h2>
          <button
            onClick={() => setShowAdd((s) => !s)}
            className="btn-secondary"
          >
            {showAdd ? 'Cancel' : '+ Add item'}
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Disabled items are excluded from compliance calculations but kept for history.
        </p>

        {showAdd && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="label">Short label</label>
              <input
                className="input"
                value={addDraft.shortLabel}
                onChange={(e) => setAddDraft({ ...addDraft, shortLabel: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Phase</label>
              <select
                className="input"
                value={addDraft.phase}
                onChange={(e) => setAddDraft({ ...addDraft, phase: e.target.value })}
              >
                {PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="label">Description</label>
              <input
                className="input"
                value={addDraft.description}
                onChange={(e) => setAddDraft({ ...addDraft, description: e.target.value })}
              />
            </div>
            <div className="sm:col-span-3">
              <button onClick={addItem} className="btn-primary">
                Add item
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-2 py-2">#</th>
                <th className="px-2 py-2">Phase</th>
                <th className="px-2 py-2">Label</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isEditing = editing === item.id;
                return (
                  <tr key={item.id} className="border-b border-slate-100 align-top">
                    <td className="px-2 py-2 tabular-nums text-slate-400">{idx + 1}</td>
                    <td className="px-2 py-2">
                      {isEditing ? (
                        <select
                          className="input"
                          value={draft.phase}
                          onChange={(e) => setDraft({ ...draft, phase: e.target.value })}
                        >
                          {PHASES.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {item.phase}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            className="input"
                            value={draft.shortLabel}
                            onChange={(e) =>
                              setDraft({ ...draft, shortLabel: e.target.value })
                            }
                          />
                          <input
                            className="input text-xs"
                            value={draft.description}
                            onChange={(e) =>
                              setDraft({ ...draft, description: e.target.value })
                            }
                          />
                        </div>
                      ) : (
                        <div>
                          <div className={item.disabled ? 'text-slate-400 line-through' : 'font-medium'}>
                            {item.shortLabel}
                          </div>
                          <div className="text-xs text-slate-500">{item.description}</div>
                          <div className="text-[10px] uppercase tracking-wide text-slate-400">
                            {item.id}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => putItem({ ...item, disabled: !item.disabled }).then(refresh)}
                        className={`text-xs underline ${
                          item.disabled ? 'text-amber-700' : 'text-slate-700'
                        }`}
                      >
                        {item.disabled ? 'Disabled — enable' : 'Active — disable'}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit} className="btn-primary !px-2 !py-1 text-xs">
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditing(null);
                                setDraft(null);
                              }}
                              className="btn-secondary !px-2 !py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(item)}
                              className="btn-secondary !px-2 !py-1 text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => move(idx, -1)}
                              disabled={idx === 0}
                              className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40"
                              aria-label="Move up"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => move(idx, 1)}
                              disabled={idx === items.length - 1}
                              className="btn-secondary !px-2 !py-1 text-xs disabled:opacity-40"
                              aria-label="Move down"
                            >
                              ↓
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="btn-danger !px-2 !py-1 text-xs"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Procedures */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Procedure types</h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {procedures.map((p) => (
            <li key={p.name} className="flex items-center justify-between py-2 text-sm">
              <span>{p.name}</span>
              <button
                onClick={() => removeProc(p.name)}
                className="text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
          {procedures.length === 0 && (
            <li className="py-2 text-sm text-slate-400">No procedure types defined.</li>
          )}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="input"
            placeholder="New procedure type"
            value={newProc}
            onChange={(e) => setNewProc(e.target.value)}
          />
          <button onClick={addProc} className="btn-primary">
            Add
          </button>
        </div>
      </section>

      {/* Export / Import */}
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Backup & export</h2>
        <p className="mt-1 text-xs text-slate-500">
          Data lives only in this browser. Export a JSON backup regularly. CSV exports
          are for analysis in R, SPSS, or Excel.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={onExportJson} className="btn-secondary">
            Export JSON backup
          </button>
          <button onClick={onExportWideCsv} className="btn-secondary">
            Export patients (CSV, wide)
          </button>
          <button onClick={onExportLongCsv} className="btn-secondary">
            Export items (CSV, long)
          </button>
          <button onClick={onImportClick} className="btn-secondary">
            Import JSON backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
        {importError && (
          <p className="mt-2 text-xs text-red-600">{importError}</p>
        )}
      </section>

      {/* Reset */}
      <section className="card border-red-200 p-4">
        <h2 className="text-sm font-semibold text-red-700">Danger zone</h2>
        <p className="mt-1 text-xs text-slate-500">
          Permanently deletes all patient records. Items and procedures will be re-seeded
          from defaults.
        </p>
        <button onClick={onReset} className="btn-danger mt-3">
          Reset all data
        </button>
      </section>
    </div>
  );
}
