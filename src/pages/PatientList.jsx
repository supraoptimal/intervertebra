import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPatients, listItems, listProcedures } from '../lib/db.js';
import {
  patientStats,
  currentPhase,
} from '../lib/compliance.js';
import { PHASES } from '../data/erasItems.js';

const PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label]));

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [items, setItems] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [filterSurgeon, setFilterSurgeon] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [sortBy, setSortBy] = useState('surgeryDate');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    Promise.all([listPatients(), listItems(), listProcedures()]).then(
      ([ps, is, prs]) => {
        setPatients(ps);
        setItems(is);
        setProcedures(prs);
        setLoaded(true);
      }
    );
  }, []);

  const activeItems = useMemo(() => items.filter((i) => !i.disabled), [items]);
  const surgeons = useMemo(
    () => [...new Set(patients.map((p) => p.surgeonInitials).filter(Boolean))].sort(),
    [patients]
  );

  const enriched = useMemo(() => {
    return patients.map((p) => {
      const stats = patientStats(p, activeItems);
      return {
        ...p,
        rate: stats.rate,
        ratePending: stats.pending,
        currentPhase: currentPhase(p, activeItems),
      };
    });
  }, [patients, activeItems]);

  const filtered = useMemo(() => {
    return enriched.filter((p) => {
      if (filterSurgeon && p.surgeonInitials !== filterSurgeon) return false;
      if (filterProcedure && p.procedureType !== filterProcedure) return false;
      if (filterPhase && p.currentPhase !== filterPhase) return false;
      if (filterFrom && p.surgeryDate && p.surgeryDate < filterFrom) return false;
      if (filterTo && p.surgeryDate && p.surgeryDate > filterTo) return false;
      return true;
    });
  }, [enriched, filterSurgeon, filterProcedure, filterPhase, filterFrom, filterTo]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    out.sort((a, b) => {
      const av = a[sortBy] ?? '';
      const bv = b[sortBy] ?? '';
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return out;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const sortIcon = (col) => (sortBy === col ? (sortDir === 'asc' ? '↑' : '↓') : '');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {loaded ? `${patients.length} record${patients.length === 1 ? '' : 's'}` : 'Loading…'}
          </p>
        </div>
        <Link to="/patient/new" className="btn-primary">
          + New patient
        </Link>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div>
            <label className="label">Surgeon</label>
            <select
              className="input"
              value={filterSurgeon}
              onChange={(e) => setFilterSurgeon(e.target.value)}
            >
              <option value="">All</option>
              {surgeons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Procedure</label>
            <select
              className="input"
              value={filterProcedure}
              onChange={(e) => setFilterProcedure(e.target.value)}
            >
              <option value="">All</option>
              {procedures.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Phase</label>
            <select
              className="input"
              value={filterPhase}
              onChange={(e) => setFilterPhase(e.target.value)}
            >
              <option value="">All</option>
              {PHASES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                {[
                  ['caseNumber', 'Case'],
                  ['surgeonInitials', 'Surgeon'],
                  ['procedureType', 'Procedure'],
                  ['surgeryDate', 'Surgery date'],
                  ['currentPhase', 'Phase'],
                  ['rate', 'Compliance'],
                  ['updatedAt', 'Updated'],
                ].map(([col, label]) => (
                  <th
                    key={col}
                    onClick={() => toggleSort(col)}
                    className="cursor-pointer px-4 py-2 font-medium hover:text-slate-900"
                  >
                    {label} {sortIcon(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 && (
                <tr>
                  <td className="px-4 py-12 text-center text-slate-500" colSpan={7}>
                    {loaded
                      ? 'No patients yet. Click "+ New patient" to start.'
                      : ' '}
                  </td>
                </tr>
              )}
              {sorted.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-2 font-medium">
                    <Link to={`/patient/${p.id}`} className="text-slate-900 hover:underline">
                      {p.caseNumber || <span className="text-slate-400">(unset)</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{p.surgeonInitials || '—'}</td>
                  <td className="px-4 py-2">{p.procedureType || '—'}</td>
                  <td className="px-4 py-2 tabular-nums">{p.surgeryDate || '—'}</td>
                  <td className="px-4 py-2">
                    {p.currentPhase ? PHASE_LABEL[p.currentPhase] : '—'}
                  </td>
                  <td className="px-4 py-2 tabular-nums">
                    {p.rate === null ? '—' : `${Math.round(p.rate * 100)}%`}
                  </td>
                  <td className="px-4 py-2 text-slate-500 tabular-nums">
                    {p.updatedAt?.slice(0, 10) || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
