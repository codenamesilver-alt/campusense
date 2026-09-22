const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const RESOURCE_TABLE_MAP = {
  Student: 'students',
  Staff: 'staff',
  Class: 'classes',
  Section: 'sections',
  Subject: 'subjects',
  SubjectGroup: 'subject_groups',
  Timetable: 'timetables',
  Attendance: 'attendances',
  Fee: 'fees',
  FeeHead: 'fee_heads',
  FeeDue: 'fee_dues',
  FeeTransaction: 'fee_transactions',
  ApprovalRequest: 'approval_requests',
  ClassFeeStructure: 'class_fee_structures',
  StudentFeeMapping: 'student_fee_mappings',
  StudentDiscount: 'student_discounts',
  IncomeHead: 'income_heads',
  Income: 'incomes',
  ExpenseHead: 'expense_heads',
  Expense: 'expenses',
  ExamGroup: 'exam_groups',
  ExamSchedule: 'exam_schedules',
  ExamResult: 'exam_results',
  StudentResult: 'student_results',
  GradeConfiguration: 'grade_configurations',
  DivisionConfiguration: 'division_configurations',
  ReportCardSettings: 'report_card_settings',
  Notice: 'notices',
  SchoolSetting: 'school_settings',
  Session: 'sessions',
  RolePermission: 'role_permissions',
  User: 'users',
  AdmissionEnquiry: 'admission_enquiries',
  Complaint: 'complaints',
  Department: 'departments',
  Designation: 'designations',
  LeaveApplication: 'leave_applications',
  LeaveManagementPolicy: 'leave_management_policies',
  PayrollRecord: 'payroll_records',
  Book: 'books',
  BookIssue: 'book_issues',
  InventoryItem: 'inventory_items',
  ItemIssue: 'item_issues',
  Route: 'routes',
  Vehicle: 'vehicles',
  SchoolEvent: 'school_events',
  StaffAttendance: 'staff_attendances',
  Holiday: 'holidays',
  FeesGroup: 'fees_groups',
  FeesType: 'fees_types',
  FeesMaster: 'fees_masters',
  FeesDiscount: 'fees_discounts',
  FeesPayment: 'fees_payments',
  ClassTeacherAssignment: 'class_teacher_assignments',
  ItemCategory: 'item_categories',
  ItemSupplier: 'item_suppliers',
  StudentHouse: 'student_houses',
  StudentTransport: 'student_transports',
  EmailTemplate: 'email_templates',
  SMSTemplate: 'sms_templates',
  StudentAttendanceInsight: 'student_attendance_insights'
};

function getTable(resource) {
  const table = RESOURCE_TABLE_MAP[resource];
  if (!table) {
    const err = new Error(`Unknown resource: ${resource}`);
    err.status = 404;
    throw err;
  }
  return table;
}

const columnCache = new Map();

async function getColumns(table) {
  if (!columnCache.has(table)) {
    columnCache.set(table, await db(table).columnInfo());
  }
  return columnCache.get(table);
}

const USER_TABLE = 'users';

function stripUnknownColumns(data, tableInfo) {
  const dropped = [];
  for (const key of Object.keys(data)) {
    if (!(key in tableInfo)) {
      dropped.push(key);
      delete data[key];
    }
  }
  if (dropped.length > 0) {
    console.warn(`[crud] dropped unknown column keys: ${dropped.join(', ')}`);
  }
  return data;
}

function normalizeUserData(table, data) {
  if (table === USER_TABLE && typeof data.email === 'string') {
    data.email = data.email.toLowerCase().trim();
  }
  return data;
}

function hideSecrets(table, rows) {
  if (table !== USER_TABLE) return rows;
  const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
  for (const row of list) {
    if (row && 'password_hash' in row) delete row.password_hash;
  }
  return rows;
}

async function applySort(queryBuilder, table, sort) {
  if (!sort) return;
  const columns = await getColumns(table);
  const sortable = Array.isArray(sort) ? sort : [sort];
  for (const s of sortable) {
    if (typeof s !== 'string') continue;
    let field = s;
    let dir = 'asc';
    if (s.startsWith('-')) {
      field = s.slice(1);
      dir = 'desc';
    }
    if (!columns[field]) continue;
    queryBuilder.orderBy(field, dir);
  }
}

router.get('/:resource/filter', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const { sort, limit, skip, ...q } = req.query;

    const query = {};
    for (const [key, value] of Object.entries(q)) {
      if (['created_date', 'updated_date'].includes(key) && value === '') continue;
      if (typeof value === 'string' && value.trim() === '') continue;
      query[key] = value;
    }

    let builder = db(table);
    const columns = await getColumns(table);
    for (const [key, value] of Object.entries(query)) {
      if (!columns[key]) continue;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        for (const [op, operand] of Object.entries(value)) {
          switch (op) {
            case '$gte': builder = builder.where(key, '>=', operand); break;
            case '$gt': builder = builder.where(key, '>', operand); break;
            case '$lte': builder = builder.where(key, '<=', operand); break;
            case '$lt': builder = builder.where(key, '<', operand); break;
            case '$eq': builder = builder.where(key, '=', operand); break;
            case '$ne': builder = builder.whereNot(key, operand); break;
            case '$in': builder = builder.whereIn(key, Array.isArray(operand) ? operand : [operand]); break;
            case '$nin': builder = builder.whereNotIn(key, Array.isArray(operand) ? operand : [operand]); break;
            case '$like': builder = builder.where(key, 'like', `%${operand}%`); break;
            default:
              if (columns[key]) builder = builder.where(key, op, operand);
          }
        }
      } else if (value === null) {
        builder = builder.whereNull(key);
      } else {
        builder = builder.where(key, value);
      }
    }

    applySort(builder, table, sort);
    if (limit) builder.limit(Number(limit));
    if (skip) builder.offset(Number(skip));

    res.json(hideSecrets(table, await builder));
  } catch (error) {
    next(error);
  }
});

router.get('/:resource', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const { sort, limit, skip } = req.query;
    let builder = db(table);

    applySort(builder, table, sort);
    if (limit) builder.limit(Number(limit));
    if (skip) builder.offset(Number(skip));

    res.json(hideSecrets(table, await builder));
  } catch (error) {
    next(error);
  }
});

router.get('/:resource/:id', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const row = await db(table).where({ id: req.params.id }).first();
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(hideSecrets(table, row));
  } catch (error) {
    next(error);
  }
});

router.post('/:resource', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const data = { ...req.body };

    if (typeof data.id === 'string' && /^\d+$/.test(data.id)) {
      data.id = Number(data.id);
    }

    // Auto insert created_date if table has it and not provided
    const tableInfo = await db(table).columnInfo();
    stripUnknownColumns(data, tableInfo);
    normalizeUserData(table, data);
    if (tableInfo.created_date && !data.created_date) {
      data.created_date = new Date();
    }

    const rows = await db(table).insert(data).returning('*');
    const created = Array.isArray(rows) ? rows[0] : rows.rows[0];
    res.status(201).json(hideSecrets(table, created));
  } catch (error) {
    next(error);
  }
});

router.post('/:resource/bulk', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const records = Array.isArray(req.body) ? req.body : (req.body.records || []);
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Records array required' });
    }

    const tableInfo = await db(table).columnInfo();
    const cleaned = records.map((r) => {
      const out = { ...r };
      stripUnknownColumns(out, tableInfo);
      normalizeUserData(table, out);
      if (tableInfo.created_date && !out.created_date) out.created_date = new Date();
      return out;
    });

    const rows = await db(table).insert(cleaned).returning('*');
    const created = Array.isArray(rows) ? rows : rows.rows;
    res.status(201).json(hideSecrets(table, created));
  } catch (error) {
    next(error);
  }
});

router.patch('/:resource/:id', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const data = { ...req.body };
    delete data.id;
    delete data.created_date;

    const tableInfo = await db(table).columnInfo();
    stripUnknownColumns(data, tableInfo);
    normalizeUserData(table, data);
    if (tableInfo.updated_date) {
      data.updated_date = new Date();
    }

    const count = await db(table).where({ id: req.params.id }).update(data);
    if (count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await db(table).where({ id: req.params.id }).first();
    res.json(hideSecrets(table, updated));
  } catch (error) {
    next(error);
  }
});

router.put('/:resource/:id', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const data = { ...req.body };
    delete data.id;
    delete data.created_date;

    const tableInfo = await db(table).columnInfo();
    stripUnknownColumns(data, tableInfo);
    normalizeUserData(table, data);
    if (tableInfo.updated_date) {
      data.updated_date = new Date();
    }

    const count = await db(table).where({ id: req.params.id }).update(data);
    if (count === 0) return res.status(404).json({ error: 'Not found' });
    const updated = await db(table).where({ id: req.params.id }).first();
    res.json(hideSecrets(table, updated));
  } catch (error) {
    next(error);
  }
});

router.delete('/:resource/:id', authenticate, async (req, res, next) => {
  try {
    const table = getTable(req.params.resource);
    const count = await db(table).where({ id: req.params.id }).del();
    if (count === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.RESOURCE_TABLE_MAP = RESOURCE_TABLE_MAP;
