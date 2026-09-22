const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const APPLY_FIELD_MAP = {
  total_amount: 'total_amount',
  discount_amount: 'discount_amount',
  late_fine: 'late_fine',
  tax_amount: 'tax_amount',
  net_amount: 'net_amount',
  payment_mode: 'payment_mode',
  transaction_date: 'transaction_date'
};

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can approve or reject requests' });
  }
  next();
}

function ensureRequestData(req, res, next) {
  if (!req.body || !Array.isArray(req.body.changes) || req.body.changes.length === 0) {
    return res.status(400).json({ error: 'changes array is required' });
  }
  if (!req.body.reason || !req.body.reason.trim()) {
    return res.status(400).json({ error: 'reason/comment is required' });
  }
  const bad = req.body.changes.find((c) => !c || !c.field || !(c.field in APPLY_FIELD_MAP));
  if (bad) {
    return res.status(400).json({ error: `invalid change field: ${bad && bad.field}` });
  }
  if (!req.body.transaction_id) {
    const t = req.body.changes[0] && req.body.changes[0].transaction_id;
    req.body.transaction_id = t;
  }
  if (!req.body.transaction_id) {
    return res.status(400).json({ error: 'transaction_id is required' });
  }
  next();
}

// Create an approval request for a fee edit
router.post('/', authenticate, ensureRequestData, async (req, res, next) => {
  try {
    const { transaction_id, changes, reason } = req.body;
    const allowed = Object.keys(APPLY_FIELD_MAP);

    const tx = await db('fee_transactions').where({ id: transaction_id }).first();
    if (!tx) return res.status(404).json({ error: 'Fee transaction not found' });

    const cleaned = changes.map((c) => ({ ...c }));

    const row = await db('approval_requests')
      .insert({
        transaction_id,
        changes: JSON.stringify(cleaned),
        reason: String(reason).trim(),
        requested_by_user_id: req.user.id,
        requested_by_name: [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || 'Unknown',
        status: 'pending'
      })
      .returning('*');

    const created = Array.isArray(row) ? row[0] : row.rows[0];
    const out = { ...created, allowed_fields: allowed };
    res.status(201).json(out);
  } catch (error) {
    next(error);
  }
});

// Approve: validate pending, apply changes to fee_transactions, mark approved
router.post('/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  const trx = await db.transaction();
  try {
    const id = req.params.id;
    const request = await trx('approval_requests').where({ id }).first();
    if (!request) {
      await trx.rollback();
      return res.status(404).json({ error: 'Request not found' });
    }
    if (request.status !== 'pending') {
      await trx.rollback();
      return res.status(409).json({ error: `Request already ${request.status}` });
    }

    let changes = request.changes;
    if (typeof changes === 'string') changes = JSON.parse(changes);
    if (!Array.isArray(changes)) changes = [];

    const updateData = {};
    for (const c of changes) {
      if (!c || !(c.field in APPLY_FIELD_MAP)) continue;
      updateData[c.field] = c.new_value;
    }

    if (Object.keys(updateData).length > 0) {
      const count = await trx('fee_transactions').where({ id: request.transaction_id }).update(updateData);
      if (count === 0) {
        await trx.rollback();
        return res.status(404).json({ error: 'Fee transaction not found' });
      }
    }

    const approvedByName = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
    await trx('approval_requests').where({ id }).update({
      status: 'approved',
      approved_by_name: approvedByName,
      admin_comment: req.body && req.body.comment ? String(req.body.comment) : null,
      updated_date: new Date()
    });

    await trx.commit();
    const updated = await db('approval_requests').where({ id }).first();
    res.json(updated);
  } catch (error) {
    await trx.rollback();
    next(error);
  }
});

// Reject: mark rejected (fee_transactions untouched)
router.post('/:id/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = req.params.id;
    const request = await db('approval_requests').where({ id }).first();
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') {
      return res.status(409).json({ error: `Request already ${request.status}` });
    }

    const approvedByName = [req.user.first_name, req.user.last_name].filter(Boolean).join(' ').trim() || 'Unknown';
    await db('approval_requests').where({ id }).update({
      status: 'rejected',
      approved_by_name: approvedByName,
      admin_comment: req.body && req.body.comment ? String(req.body.comment) : null,
      updated_date: new Date()
    });

    const updated = await db('approval_requests').where({ id }).first();
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;