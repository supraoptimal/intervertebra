// IndexedDB wrapper for Inter Vertebra.
//
// Stores:
//   - patients: keyed by id (UUID). Indexed by surgeryDate, surgeonInitials.
//   - items:    ERAS item definitions, keyed by id (slug). Includes `order`
//               and `disabled` flags so user customisation persists.
//   - procedures: list of allowed procedureType strings, keyed by name.
//   - meta:     singleton settings/metadata.
//
// IMPORTANT: We persist a copy of the seed items into the DB on first open
// so that the user can edit, disable, or reorder them in Settings.

import { openDB } from 'idb';
import { SEED_ERAS_ITEMS, SEED_PROCEDURE_TYPES } from '../data/erasItems.js';
import { uuid } from './uuid.js';

const DB_NAME = 'inter-vertebra';
const DB_VERSION = 1;

let _dbPromise = null;

export function getDB() {
  if (!_dbPromise) {
    _dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patients')) {
          const s = db.createObjectStore('patients', { keyPath: 'id' });
          s.createIndex('by-surgery-date', 'surgeryDate');
          s.createIndex('by-surgeon', 'surgeonInitials');
        }
        if (!db.objectStoreNames.contains('items')) {
          db.createObjectStore('items', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('procedures')) {
          db.createObjectStore('procedures', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      },
    }).then(async (db) => {
      await ensureSeedData(db);
      return db;
    });
  }
  return _dbPromise;
}

async function ensureSeedData(db) {
  const itemCount = await db.count('items');
  if (itemCount === 0) {
    const tx = db.transaction('items', 'readwrite');
    SEED_ERAS_ITEMS.forEach((item, idx) => {
      tx.store.put({ ...item, order: idx, disabled: false });
    });
    await tx.done;
  }
  const procCount = await db.count('procedures');
  if (procCount === 0) {
    const tx = db.transaction('procedures', 'readwrite');
    SEED_PROCEDURE_TYPES.forEach((name, idx) => {
      tx.store.put({ name, order: idx });
    });
    await tx.done;
  }
  const seeded = await db.get('meta', 'seeded');
  if (!seeded) {
    await db.put('meta', { key: 'seeded', value: new Date().toISOString() });
  }
}

// ─────────────────────────── Patients ───────────────────────────

export async function listPatients() {
  const db = await getDB();
  return db.getAll('patients');
}

export async function getPatient(id) {
  const db = await getDB();
  return db.get('patients', id);
}

export async function createPatient(partial) {
  const now = new Date().toISOString();
  const patient = {
    id: uuid(),
    caseNumber: '',
    surgeonInitials: '',
    procedureType: '',
    surgeryDate: '',
    ageBand: '',
    sex: '',
    notes: '',
    complianceItems: {},
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
  const db = await getDB();
  await db.put('patients', patient);
  return patient;
}

export async function updatePatient(id, patch) {
  const db = await getDB();
  const existing = await db.get('patients', id);
  if (!existing) return null;
  const next = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  await db.put('patients', next);
  return next;
}

export async function setComplianceStatus(id, itemId, status, comment) {
  const db = await getDB();
  const existing = await db.get('patients', id);
  if (!existing) return null;
  const prev = existing.complianceItems?.[itemId] || {};
  const entry = {
    status,
    timestamp: new Date().toISOString(),
    comment: comment !== undefined ? comment : prev.comment || '',
  };
  const next = {
    ...existing,
    complianceItems: { ...existing.complianceItems, [itemId]: entry },
    updatedAt: new Date().toISOString(),
  };
  await db.put('patients', next);
  return next;
}

export async function deletePatient(id) {
  const db = await getDB();
  await db.delete('patients', id);
}

// ───────────────────────────── Items ─────────────────────────────

export async function listItems() {
  const db = await getDB();
  const items = await db.getAll('items');
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function putItem(item) {
  const db = await getDB();
  await db.put('items', item);
}

export async function deleteItem(id) {
  const db = await getDB();
  await db.delete('items', id);
}

export async function reorderItems(orderedIds) {
  const db = await getDB();
  const tx = db.transaction('items', 'readwrite');
  for (let i = 0; i < orderedIds.length; i += 1) {
    const existing = await tx.store.get(orderedIds[i]);
    if (existing) {
      await tx.store.put({ ...existing, order: i });
    }
  }
  await tx.done;
}

// ─────────────────────────── Procedures ──────────────────────────

export async function listProcedures() {
  const db = await getDB();
  const list = await db.getAll('procedures');
  return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function putProcedure(name) {
  const db = await getDB();
  const existing = await db.getAll('procedures');
  if (existing.find((p) => p.name === name)) return;
  await db.put('procedures', { name, order: existing.length });
}

export async function deleteProcedure(name) {
  const db = await getDB();
  await db.delete('procedures', name);
}

// ─────────────────────────── Backup/Reset ────────────────────────

export async function exportAll() {
  const db = await getDB();
  const [patients, items, procedures, meta] = await Promise.all([
    db.getAll('patients'),
    db.getAll('items'),
    db.getAll('procedures'),
    db.getAll('meta'),
  ]);
  return {
    schema: 'inter-vertebra/v1',
    exportedAt: new Date().toISOString(),
    patients,
    items,
    procedures,
    meta,
  };
}

export async function importAll(payload) {
  if (!payload || payload.schema !== 'inter-vertebra/v1') {
    throw new Error('Unrecognised backup file. Expected schema inter-vertebra/v1.');
  }
  const db = await getDB();
  const tx = db.transaction(['patients', 'items', 'procedures', 'meta'], 'readwrite');
  await Promise.all(['patients', 'items', 'procedures', 'meta'].map((s) => tx.objectStore(s).clear()));
  for (const p of payload.patients || []) await tx.objectStore('patients').put(p);
  for (const i of payload.items || []) await tx.objectStore('items').put(i);
  for (const pr of payload.procedures || []) await tx.objectStore('procedures').put(pr);
  for (const m of payload.meta || []) await tx.objectStore('meta').put(m);
  await tx.done;
}

export async function resetAll() {
  const db = await getDB();
  const tx = db.transaction(['patients', 'items', 'procedures', 'meta'], 'readwrite');
  await Promise.all(['patients', 'items', 'procedures', 'meta'].map((s) => tx.objectStore(s).clear()));
  await tx.done;
  // Re-seed items and procedures so the app is usable immediately.
  await ensureSeedData(db);
}
