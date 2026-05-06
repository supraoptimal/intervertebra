import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createPatient,
  deletePatient,
  getPatient,
  listItems,
  listProcedures,
  setComplianceStatus,
  updatePatient,
} from '../lib/db.js';
import {
  patientStats,
  phaseStats,
  statusOf,
} from '../lib/compliance.js';
import { PHASES } from '../data/erasItems.js';
import {
  AGE_BANDS,
  SEXES,
  caseNumberWarning,
  looksLikeHKID,
} from '../lib/validation.js';
import StatusPicker from '../components/StatusPicker.jsx';

const STATUS_KEYS = { 1: 'yes', 2: 'no', 3: 'na', 4: 'pending' };

export default function PatientDetail({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [items, setItems] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [openPhases, setOpenPhases] = useState(() => new Set(PHASES.map((p) => p.id)));
  const [focusedItemId, setFocusedItemId] = useState(null);
  const itemRefs = useRef({});
  // StrictMode double-invokes effects in dev; guard against creating two
  // patient records for a single visit to /patient/new.
  const createGuard = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listItems(), listProcedures()]).then(async ([is, prs]) => {
      if (cancelled) return;
      setItems(is);
      setProcedures(prs);
      if (mode === 'new') {
        if (createGuard.current) return;
        createGuard.current = true;
        const fresh = await createPatient({});
        if (cancelled) return;
        setPatient(fresh);
        navigate(`/patient/${fresh.id}`, { replace: true });
        setLoaded(true);
      } else if (id) {
        const p = await getPatient(id);
        if (cancelled) return;
        if (!p) {
          navigate('/', { replace: true });
          return;
        }
        setPatient(p);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, mode, navigate]);

  const activeItems = useMemo(() => items.filter((i) => !i.disabled), [items]);

  const itemsByPhase = useMemo(() => {
    const out = {};
    for (const phase of PHASES) out[phase.id] = [];
    for (const item of activeItems) {
      if (out[item.phase]) out[item.phase].push(item);
    }
    return out;
  }, [activeItems]);

  const flatActiveItems = useMemo(
    () => PHASES.flatMap((p) => itemsByPhase[p.id] || []),
    [itemsByPhase]
  );

  const overallStats = useMemo(
    () => (patient ? patientStats(patient, activeItems) : null),
    [patient, activeItems]
  );

  const perPhase = useMemo(
    () => (patient ? phaseStats(patient, activeItems) : {}),
    [patient, activeItems]
  );

  // Optimistic update of compliance status
  const updateStatus = useCallback(
    async (itemId, status) => {
      if (!patient) return;
      const prevEntry = patient.complianceItems?.[itemId] || {};
      setPatient((cur) => ({
        ...cur,
        complianceItems: {
          ...cur.complianceItems,
          [itemId]: {
            ...prevEntry,
            status,
            timestamp: new Date().toISOString(),
          },
        },
        updatedAt: new Date().toISOString(),
      }));
      await setComplianceStatus(patient.id, itemId, status, prevEntry.comment);
    },
    [patient]
  );

  const updateComment = useCallback(
    async (itemId, comment) => {
      if (!patient) return;
      const prevEntry = patient.complianceItems?.[itemId] || {};
      const status = prevEntry.status || 'pending';
      setPatient((cur) => ({
        ...cur,
        complianceItems: {
          ...cur.complianceItems,
          [itemId]: { ...prevEntry, status, comment },
        },
      }));
      await setComplianceStatus(patient.id, itemId, status, comment);
    },
    [patient]
  );

  const updateMeta = useCallback(
    async (patch) => {
      if (!patient) return;
      setPatient((cur) => ({ ...cur, ...patch, updatedAt: new Date().toISOString() }));
      await updatePatient(patient.id, patch);
    },
    [patient]
  );

  const onDelete = useCallback(async () => {
    if (!patient) return;
    if (!window.confirm('Delete this patient record? This cannot be undone.')) return;
    await deletePatient(patient.id);
    navigate('/', { replace: true });
  }, [patient, navigate]);

  // Keyboard shortcuts: number keys 1-4 set status of focused item;
  // arrow keys navigate between items.
  useEffect(() => {
    if (!flatActiveItems.length) return;
    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      const isEditable =
        tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;
      if (isEditable) return;

      const idx = focusedItemId
        ? flatActiveItems.findIndex((i) => i.id === focusedItemId)
        : -1;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const next = flatActiveItems[Math.min(idx + 1, flatActiveItems.length - 1)] || flatActiveItems[0];
        if (next) {
          setFocusedItemId(next.id);
          itemRefs.current[next.id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = flatActiveItems[Math.max(idx - 1, 0)] || flatActiveItems[0];
        if (prev) {
          setFocusedItemId(prev.id);
          itemRefs.current[prev.id]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return;
      }
      if (STATUS_KEYS[e.key] && focusedItemId) {
        e.preventDefault();
        updateStatus(focusedItemId, STATUS_KEYS[e.key]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flatActiveItems, focusedItemId, updateStatus]);

  const togglePhase = (phaseId) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  if (!loaded || !patient) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  const caseWarning = caseNumberWarning(patient.caseNumber);
  const caseInvalid = looksLikeHKID(patient.caseNumber);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {patient.caseNumber || 'New patient'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {overallStats.rate === null
              ? 'No Yes/No entries yet'
              : `Compliance ${Math.round(overallStats.rate * 100)}% · ${overallStats.yes}/${overallStats.yes + overallStats.no} answered Yes`}
            {' · '}
            {overallStats.pending} pending · {overallStats.na} N/A
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to list
          </button>
          <button onClick={onDelete} className="btn-danger">
            Delete patient
          </button>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <strong>Privacy reminder:</strong> Do not enter patient-identifiable information.
        Use a de-identified internal reference number only (e.g. <code>ERAS-001</code>).
      </div>

      {/* Metadata */}
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Case number</label>
            <input
              className={`input ${caseInvalid ? 'ring-red-400 focus:ring-red-500' : ''}`}
              value={patient.caseNumber}
              placeholder="ERAS-001"
              onChange={(e) => updateMeta({ caseNumber: e.target.value })}
            />
            {caseWarning && (
              <p
                className={`mt-1 text-xs ${
                  caseInvalid ? 'text-red-600' : 'text-amber-700'
                }`}
              >
                {caseWarning}
              </p>
            )}
          </div>
          <div>
            <label className="label">Surgeon initials</label>
            <input
              className="input"
              value={patient.surgeonInitials}
              placeholder="GL"
              maxLength={6}
              onChange={(e) => updateMeta({ surgeonInitials: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="label">Procedure type</label>
            <select
              className="input"
              value={patient.procedureType}
              onChange={(e) => updateMeta({ procedureType: e.target.value })}
            >
              <option value="">—</option>
              {procedures.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Surgery date</label>
            <input
              type="date"
              className="input"
              value={patient.surgeryDate}
              onChange={(e) => updateMeta({ surgeryDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Age band</label>
            <select
              className="input"
              value={patient.ageBand}
              onChange={(e) => updateMeta({ ageBand: e.target.value })}
            >
              <option value="">—</option>
              {AGE_BANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sex</label>
            <select
              className="input"
              value={patient.sex}
              onChange={(e) => updateMeta({ sex: e.target.value })}
            >
              <option value="">—</option>
              {SEXES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Notes (optional)</label>
          <textarea
            className="input min-h-[60px]"
            value={patient.notes || ''}
            onChange={(e) => updateMeta({ notes: e.target.value })}
            placeholder="Free-text notes about the case (no identifiers)."
          />
        </div>
      </div>

      <div className="rounded-md bg-slate-100 p-3 text-xs text-slate-600">
        <strong className="text-slate-900">Keyboard:</strong> click any item to focus it,
        then press <kbd className="rounded bg-white px-1 ring-1 ring-slate-300">1</kbd> Yes,
        <kbd className="ml-1 rounded bg-white px-1 ring-1 ring-slate-300">2</kbd> No,
        <kbd className="ml-1 rounded bg-white px-1 ring-1 ring-slate-300">3</kbd> N/A,
        <kbd className="ml-1 rounded bg-white px-1 ring-1 ring-slate-300">4</kbd> Pending,
        <kbd className="ml-1 rounded bg-white px-1 ring-1 ring-slate-300">↑/↓</kbd> navigate.
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const phaseItems = itemsByPhase[phase.id] || [];
          if (phaseItems.length === 0) return null;
          const stats = perPhase[phase.id];
          const open = openPhases.has(phase.id);
          const completed = phaseItems.filter(
            (i) => statusOf(patient, i.id) !== 'pending'
          ).length;
          return (
            <section
              key={phase.id}
              className="card overflow-hidden"
            >
              <button
                onClick={() => togglePhase(phase.id)}
                className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left hover:bg-slate-100"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {phase.label}
                  </div>
                  <div className="text-xs text-slate-500">
                    {completed}/{phaseItems.length} answered
                    {stats?.rate !== null && stats?.rate !== undefined &&
                      ` · ${Math.round(stats.rate * 100)}% compliant`}
                  </div>
                </div>
                <span aria-hidden className="text-slate-400">
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <ul className="divide-y divide-slate-100">
                  {phaseItems.map((item) => {
                    const entry = patient.complianceItems?.[item.id] || {};
                    const status = entry.status || 'pending';
                    const focused = focusedItemId === item.id;
                    return (
                      <li
                        key={item.id}
                        ref={(el) => (itemRefs.current[item.id] = el)}
                        tabIndex={0}
                        onFocus={() => setFocusedItemId(item.id)}
                        onClick={() => setFocusedItemId(item.id)}
                        className={`px-4 py-3 outline-none ${
                          focused ? 'bg-slate-50 ring-2 ring-inset ring-slate-300' : ''
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1 min-w-[200px]">
                            <div
                              className="text-sm font-medium text-slate-900"
                              title={item.description}
                            >
                              {item.shortLabel}
                              <span
                                className={`ml-2 inline-block h-2 w-2 rounded-full align-middle ${
                                  status === 'yes'
                                    ? 'bg-compliance-yes'
                                    : status === 'no'
                                      ? 'bg-compliance-no'
                                      : status === 'na'
                                        ? 'bg-compliance-na'
                                        : 'bg-compliance-pending'
                                }`}
                                aria-label={`status: ${status}`}
                              />
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {item.description}
                            </p>
                          </div>
                          <StatusPicker
                            value={status}
                            onChange={(v) => updateStatus(item.id, v)}
                          />
                        </div>
                        <div className="mt-2">
                          <input
                            className="input text-xs"
                            placeholder="Comment (optional)"
                            value={entry.comment || ''}
                            onChange={(e) => updateComment(item.id, e.target.value)}
                          />
                          {entry.timestamp && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Last updated {new Date(entry.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
