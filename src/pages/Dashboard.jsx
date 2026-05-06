import { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { listPatients, listItems, listProcedures } from '../lib/db.js';
import {
  patientStats,
  currentPhase,
  complianceByItem,
  complianceBySurgeon,
  complianceByMonth,
} from '../lib/compliance.js';
import { PHASES } from '../data/erasItems.js';

const PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label]));

function pct(v) {
  if (v === null || v === undefined) return '—';
  return `${Math.round(v * 100)}%`;
}

function ItemTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow">
      <div className="font-medium text-slate-900">{d.shortLabel}</div>
      <div className="text-slate-500">{PHASE_LABEL[d.phase]}</div>
      <div className="mt-1 tabular-nums">
        {pct(d.rate)} · n={d.n} ({d.yes} yes, {d.no} no)
      </div>
    </div>
  );
}

function MonthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow">
      <div className="font-medium text-slate-900">{label}</div>
      <div className="tabular-nums">
        Mean compliance {pct(d.rate)} · {d.patients} patient{d.patients === 1 ? '' : 's'}
      </div>
    </div>
  );
}

function SurgeonTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow">
      <div className="font-medium text-slate-900">{d.surgeon}</div>
      <div className="tabular-nums">
        {pct(d.rate)} · {d.patients} patient{d.patients === 1 ? '' : 's'} · n={d.n}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [items, setItems] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterSurgeon, setFilterSurgeon] = useState('');
  const [filterProcedure, setFilterProcedure] = useState('');

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

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      if (filterSurgeon && p.surgeonInitials !== filterSurgeon) return false;
      if (filterProcedure && p.procedureType !== filterProcedure) return false;
      if (filterFrom && p.surgeryDate && p.surgeryDate < filterFrom) return false;
      if (filterTo && p.surgeryDate && p.surgeryDate > filterTo) return false;
      return true;
    });
  }, [patients, filterFrom, filterTo, filterSurgeon, filterProcedure]);

  const summary = useMemo(() => {
    const rates = filtered
      .map((p) => patientStats(p, activeItems).rate)
      .filter((r) => r !== null);
    const meanRate =
      rates.length === 0 ? null : rates.reduce((a, b) => a + b, 0) / rates.length;
    const phaseCounts = {};
    for (const p of filtered) {
      const ph = currentPhase(p, activeItems) || '—';
      phaseCounts[ph] = (phaseCounts[ph] || 0) + 1;
    }
    return { count: filtered.length, meanRate, phaseCounts };
  }, [filtered, activeItems]);

  const byItem = useMemo(
    () =>
      complianceByItem(filtered, activeItems)
        .filter((d) => d.n > 0)
        .map((d) => ({ ...d, ratePct: d.rate === null ? 0 : Math.round(d.rate * 100) }))
        .sort((a, b) => (a.rate ?? 1) - (b.rate ?? 1)),
    [filtered, activeItems]
  );

  const bySurgeon = useMemo(
    () =>
      complianceBySurgeon(filtered, activeItems).map((d) => ({
        ...d,
        ratePct: d.rate === null ? 0 : Math.round(d.rate * 100),
      })),
    [filtered, activeItems]
  );

  const byMonth = useMemo(
    () =>
      complianceByMonth(filtered, activeItems).map((d) => ({
        ...d,
        ratePct: d.rate === null ? 0 : Math.round(d.rate * 100),
      })),
    [filtered, activeItems]
  );

  if (!loaded) {
    return <div className="text-sm text-slate-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Compliance rate is Yes / (Yes + No). N/A and Pending are excluded from the denominator.
        </p>
      </div>

      <div className="card p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Patients
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {summary.count}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Mean compliance
          </div>
          <div className="mt-1 text-2xl font-semibold tabular-nums">
            {pct(summary.meanRate)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Patients per phase
          </div>
          <div className="mt-2 space-y-0.5 text-sm">
            {PHASES.map((p) => (
              <div key={p.id} className="flex justify-between">
                <span className="text-slate-600">{p.label}</span>
                <span className="tabular-nums">{summary.phaseCounts[p.id] || 0}</span>
              </div>
            ))}
            {summary.phaseCounts['—'] && (
              <div className="flex justify-between text-slate-400">
                <span>Untouched</span>
                <span className="tabular-nums">{summary.phaseCounts['—']}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance per item */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Compliance rate by item
        </h2>
        <p className="text-xs text-slate-500">
          Sorted ascending — worst-performing items first.
        </p>
        <div className="mt-4 h-[max(360px,calc(28px*var(--rows,22)))]"
             style={{ '--rows': byItem.length || 1 }}>
          {byItem.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byItem}
                layout="vertical"
                margin={{ top: 5, right: 24, left: 16, bottom: 5 }}
              >
                <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  dataKey="shortLabel"
                  type="category"
                  width={170}
                  tick={{ fontSize: 11, fill: '#334155' }}
                />
                <Tooltip content={<ItemTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="ratePct" fill="#0f172a" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Compliance per surgeon */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Compliance rate by surgeon
        </h2>
        <div className="mt-4 h-72">
          {bySurgeon.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bySurgeon} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="surgeon" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<SurgeonTooltip />} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="ratePct" fill="#0f172a" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Compliance over time */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Mean compliance over time
        </h2>
        <p className="text-xs text-slate-500">
          By month of surgery date. Patients without a surgery date are omitted.
        </p>
        <div className="mt-4 h-72">
          {byMonth.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byMonth} margin={{ top: 5, right: 24, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<MonthTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="ratePct"
                  name="Mean compliance %"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
