const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const crud = require('./crud');
const RESOURCE_TABLE_MAP = crud.RESOURCE_TABLE_MAP;

const router = express.Router();
router.use(authenticate);

const SKIP_IMPORT = new Set(['User', 'RolePermission']);
const SKIP_EXPORT = new Set(['User']);
const CHUNK = 500;

const colCache = new Map();
async function getColumns(table) {
  if (!colCache.has(table)) {
    colCache.set(table, await db(table).columnInfo());
  }
  return colCache.get(table);
}

function cleanRecords(records, tableInfo) {
  return records.map((r) => {
    const out = {};
    for (const [key, value] of Object.entries(r)) {
      if (!(key in tableInfo)) continue;
      out[key] = value;
    }
    return out;
  });
}

const DEPENDENCY_ORDER = [
  'Session',
  'Class',
  'Section',
  'Subject',
  'FeeHead',
  'Department',
  'Designation',
  'ExamGroup',
  'Student',
  'SchoolSetting',
  'ExamSchedule',
  'SubjectGroup',
  'ClassFeeStructure',
  'StudentFeeMapping',
  'FeeDue',
  'StudentDiscount',
  'FeeTransaction'
];

const FK_REFS = {
  SchoolSetting: { current_session_id: 'Session' },
  ExamSchedule: { exam_group_id: 'ExamGroup' },
  SubjectGroup: { subject_ids: { array: 'Subject' }, class_id: 'Class' },
  ClassFeeStructure: { fee_head_id: 'FeeHead' },
  StudentFeeMapping: { student_id: 'Student', fee_head_id: 'FeeHead' },
  FeeDue: { student_id: 'Student', fee_head_id: 'FeeHead' },
  StudentDiscount: { student_id: 'Student' },
  FeeTransaction: { student_id: 'Student' }
};

async function currentMaxId(table) {
  try {
    const r = await db.raw(`SELECT COALESCE(MAX(id), 0) AS m FROM ??`, [table]);
    return Number(r.rows[0].m) || 0;
  } catch {
    return 0;
  }
}

async function resetSequence(table) {
  try {
    const seq = await db.raw(`SELECT pg_get_serial_sequence(?, 'id') AS seq`, [table]);
    const name = seq.rows && seq.rows[0] ? seq.rows[0].seq : null;
    if (!name) return;
    const r = await db.raw(`SELECT COALESCE(MAX(id), 0) AS m FROM ??`, [table]);
    await db.raw(`SELECT setval(?, ?)`, [name, Number(r.rows[0].m) || 0]);
  } catch {
    // no serial sequence on this table
  }
}

function remapValue(value, map) {
  if (value === null || value === undefined) return value;
  const key = String(value);
  return key in map ? map[key] : value;
}

router.post('/backupRestore', async (req, res, next) => {
  try {
    const { action, backup } = req.body || {};

    if (action === 'export') {
      const result = {};
      let total = 0;
      for (const [resource, table] of Object.entries(RESOURCE_TABLE_MAP)) {
        if (SKIP_EXPORT.has(resource)) continue;
        const rows = await db(table).select('*');
        result[resource] = rows;
        total += rows.length;
      }
      return res.json({
        backup: result,
        exported_at: new Date().toISOString(),
        total_records: total
      });
    }

    if (action === 'import') {
      if (!backup || typeof backup !== 'object') {
        return res.status(400).json({ error: 'Invalid backup data' });
      }

      let restored_records = 0;
      let entities_count = 0;
      const skipped = [];
      const errors = [];
      const dropped = [];

      const idMap = {};
      let currentSessionId = null;

      const ordered = Object.entries(backup).sort((a, b) => {
        const ia = DEPENDENCY_ORDER.indexOf(a[0]);
        const ib = DEPENDENCY_ORDER.indexOf(b[0]);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });

      for (const [resource, records] of ordered) {
        if (!Array.isArray(records)) {
          if (resource !== '_files') skipped.push(resource);
          continue;
        }
        const table = RESOURCE_TABLE_MAP[resource];
        if (!table || SKIP_IMPORT.has(resource)) {
          if (resource !== '_files') skipped.push(resource);
          continue;
        }
        try {
          const tableInfo = await getColumns(table);
          let cleaned = cleanRecords(records, tableInfo);

          if (resource === 'FeeHead') {
            for (const row of cleaned) {
              if (row.name == null && row.fee_head_name != null) {
                row.name = row.fee_head_name;
              }
            }
          }
          const fk = FK_REFS[resource];
          const map = idMap[resource] || {};

          if (resource === 'Session') {
            for (const row of cleaned) {
              if (currentSessionId == null && row.is_current) {
                currentSessionId = row.id;
              }
            }
          }

          const unchanged = cleaned.map((row) => {
            const out = { ...row };
            for (const [col, ref] of Object.entries(fk || {})) {
              if (!(col in out)) continue;
              if (ref && typeof ref === 'object' && ref.array) {
                const arrMap = idMap[ref.array] || {};
                out[col] = Array.isArray(out[col])
                  ? out[col].map((v) => remapValue(v, arrMap)).filter((v) => v != null)
                  : out[col];
              } else {
                const refMap = idMap[ref] || {};
                if (col === 'current_session_id') {
                  out[col] = out[col] === '' || out[col] == null ? null : remapValue(out[col], refMap);
                } else {
                  out[col] = remapValue(out[col], refMap);
                }
              }
            }
            return out;
          });

          const isIdHex = (v) => typeof v === 'string' && /^[0-9a-f]{16,24}$/i.test(v);
          const filted = unchanged.filter((row) => {
            for (const [col, ref] of Object.entries(fk || {})) {
              if (!(col in row)) continue;
              const value = row[col];
              if (value == null) continue;
              if (ref && typeof ref === 'object' && ref.array) continue;
              if (isIdHex(value)) return false;
            }
            return true;
          });
          const droppedRows = unchanged.length - filted.length;
          if (droppedRows > 0) dropped.push({ entity: resource, count: droppedRows });

          let nextId = await currentMaxId(table);
          const withIds = filted.map((row) => {
            const oldId = row.id;
            nextId += 1;
            map[String(oldId)] = nextId;
            if (resource === 'SchoolSetting') {
              row.current_session_id = currentSessionId != null ? currentSessionId : null;
            }
            return { ...row, id: nextId };
          });

          if (resource === 'Session') {
            currentSessionId = withIds.find((r) => r.is_current)?.id || currentSessionId;
          }

          await db(table).del();
          for (let i = 0; i < withIds.length; i += CHUNK) {
            const chunk = withIds.slice(i, i + CHUNK);
            if (chunk.length > 0) await db(table).insert(chunk);
          }
          await resetSequence(table);
          idMap[resource] = map;
          restored_records += withIds.length;
          entities_count += 1;
        } catch (e) {
          errors.push({ entity: resource, error: e.message });
          console.error(`[functions] failed to restore ${resource}:`, e.message);
        }
      }

      return res.json({
        success: true,
        restored_records,
        entities_count,
        skipped,
        dropped,
        errors,
        restored_at: new Date().toISOString()
      });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;