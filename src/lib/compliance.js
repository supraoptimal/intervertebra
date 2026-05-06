// Compliance calculation helpers.
//
// Compliance rate definition:
//   rate = yes / (yes + no)
//   N/A and Pending are excluded from the denominator.
//
// All functions accept the *active* item list (disabled items already removed
// by the caller) so historical entries on disabled items are simply ignored.

import { PHASE_ORDER } from '../data/erasItems.js';

export const STATUSES = ['yes', 'no', 'na', 'pending'];

export function statusOf(patient, itemId) {
  return patient.complianceItems?.[itemId]?.status || 'pending';
}

export function patientStats(patient, items) {
  let yes = 0;
  let no = 0;
  let na = 0;
  let pending = 0;
  for (const item of items) {
    const s = statusOf(patient, item.id);
    if (s === 'yes') yes += 1;
    else if (s === 'no') no += 1;
    else if (s === 'na') na += 1;
    else pending += 1;
  }
  const denom = yes + no;
  return {
    yes,
    no,
    na,
    pending,
    total: items.length,
    rate: denom === 0 ? null : yes / denom,
  };
}

export function phaseStats(patient, items) {
  const out = {};
  for (const phase of PHASE_ORDER) {
    const phaseItems = items.filter((i) => i.phase === phase);
    if (phaseItems.length === 0) continue;
    out[phase] = patientStats(patient, phaseItems);
  }
  return out;
}

export function currentPhase(patient, items) {
  // Furthest phase that has at least one non-pending entry.
  let last = null;
  for (const phase of PHASE_ORDER) {
    const phaseItems = items.filter((i) => i.phase === phase);
    if (phaseItems.length === 0) continue;
    const touched = phaseItems.some((i) => statusOf(patient, i.id) !== 'pending');
    if (touched) last = phase;
  }
  return last;
}

export function complianceByItem(patients, items) {
  return items.map((item) => {
    let yes = 0;
    let no = 0;
    for (const p of patients) {
      const s = statusOf(p, item.id);
      if (s === 'yes') yes += 1;
      else if (s === 'no') no += 1;
    }
    const denom = yes + no;
    return {
      id: item.id,
      shortLabel: item.shortLabel,
      phase: item.phase,
      yes,
      no,
      n: denom,
      rate: denom === 0 ? null : yes / denom,
    };
  });
}

export function complianceBySurgeon(patients, items) {
  const groups = new Map();
  for (const p of patients) {
    const key = (p.surgeonInitials || '—').toUpperCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  return [...groups.entries()]
    .map(([surgeon, ps]) => {
      let yes = 0;
      let no = 0;
      for (const p of ps) {
        for (const item of items) {
          const s = statusOf(p, item.id);
          if (s === 'yes') yes += 1;
          else if (s === 'no') no += 1;
        }
      }
      const denom = yes + no;
      return {
        surgeon,
        patients: ps.length,
        yes,
        no,
        n: denom,
        rate: denom === 0 ? null : yes / denom,
      };
    })
    .sort((a, b) => a.surgeon.localeCompare(b.surgeon));
}

export function complianceByMonth(patients, items) {
  const groups = new Map();
  for (const p of patients) {
    if (!p.surgeryDate) continue;
    const month = p.surgeryDate.slice(0, 7); // YYYY-MM
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(p);
  }
  return [...groups.entries()]
    .map(([month, ps]) => {
      const rates = ps
        .map((p) => patientStats(p, items).rate)
        .filter((r) => r !== null);
      const mean = rates.length === 0 ? null : rates.reduce((a, b) => a + b, 0) / rates.length;
      return { month, patients: ps.length, rate: mean };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}
