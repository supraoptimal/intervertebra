// CSV export helpers. Wide format (one row per patient) and long format
// (one row per patient × item).

import { statusOf } from './compliance.js';

const META_COLUMNS = [
  'id',
  'caseNumber',
  'surgeonInitials',
  'procedureType',
  'surgeryDate',
  'ageBand',
  'sex',
  'createdAt',
  'updatedAt',
];

function escape(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toLine(values) {
  return values.map(escape).join(',');
}

export function patientsWideCsv(patients, items) {
  const header = [
    ...META_COLUMNS,
    ...items.map((i) => `${i.id}__status`),
    ...items.map((i) => `${i.id}__comment`),
    'notes',
  ];
  const lines = [toLine(header)];
  for (const p of patients) {
    const row = [
      ...META_COLUMNS.map((c) => p[c] ?? ''),
      ...items.map((i) => statusOf(p, i.id)),
      ...items.map((i) => p.complianceItems?.[i.id]?.comment || ''),
      p.notes || '',
    ];
    lines.push(toLine(row));
  }
  return lines.join('\n');
}

export function patientsLongCsv(patients, items) {
  const header = [
    'patient_id',
    'caseNumber',
    'surgeonInitials',
    'procedureType',
    'surgeryDate',
    'ageBand',
    'sex',
    'item_id',
    'item_label',
    'phase',
    'status',
    'timestamp',
    'comment',
  ];
  const lines = [toLine(header)];
  for (const p of patients) {
    for (const item of items) {
      const entry = p.complianceItems?.[item.id] || {};
      lines.push(
        toLine([
          p.id,
          p.caseNumber,
          p.surgeonInitials,
          p.procedureType,
          p.surgeryDate,
          p.ageBand,
          p.sex,
          item.id,
          item.shortLabel,
          item.phase,
          entry.status || 'pending',
          entry.timestamp || '',
          entry.comment || '',
        ])
      );
    }
  }
  return lines.join('\n');
}

export function downloadFile(name, text, mime = 'text/plain') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
