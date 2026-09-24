const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const supabase = require('@supabase/supabase-js').createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

const PENDING_ROLE = 'pending';
const PENDING_MESSAGE = 'Welcome to Campusense. Please ask your Admin to assign you a role. Once the role is assigned, please logout and login again to access the system.';

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await db('users').where({ email: String(email).toLowerCase().trim() }).first();
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    if (user.role === PENDING_ROLE) {
      return res.status(403).json({ error: PENDING_MESSAGE });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        staff_id: user.staff_id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/google', async (req, res, next) => {
  try {
    const { access_token, first_name, last_name } = req.body || {};
    if (!access_token) {
      return res.status(400).json({ error: 'Access token required' });
    }

    const { data, error } = await supabase.auth.getUser(access_token);
    if (error || !data.user?.email) {
      return res.status(401).json({ error: 'Invalid Google session' });
    }

    const providerUser = data.user;
    const meta = providerUser.user_metadata || {};
    const fullName = meta.full_name || meta.name || '';
    const parts = fullName.split(' ').filter(Boolean);

    const normalizedEmail = providerUser.email.toLowerCase().trim();
    let user = await db('users').where({ email: normalizedEmail }).first();
    const fName = first_name || parts[0] || '';
    const lName = last_name || parts.slice(1).join(' ') || '';

    if (!user) {
      const password_hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      const rows = await db('users').insert({
        email: normalizedEmail,
        password_hash,
        first_name: fName,
        last_name: lName,
        role: 'user',
        status: 'active'
      }).returning('*');
      user = rows[0];
    } else {
      const patch = {};
      if (!user.first_name && fName) patch.first_name = fName;
      if (!user.last_name && lName) patch.last_name = lName;
      if (Object.keys(patch).length) {
        await db('users').where({ id: user.id }).update(patch);
        user = { ...user, ...patch };
      }
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    if (user.role === PENDING_ROLE) {
      return res.status(403).json({ error: PENDING_MESSAGE });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role,
        staff_id: user.staff_id
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authenticate, async (req, res) => {
  const fullUser = await db('users').where({ id: req.user.id }).first();
  res.json({
    id: fullUser.id,
    email: fullUser.email,
    first_name: fullUser.first_name,
    last_name: fullUser.last_name,
    phone: fullUser.phone,
    role: fullUser.role,
    staff_id: fullUser.staff_id
  });
});

router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true });
});

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const existing = await db('users').where({ email: String(email).toLowerCase().trim() }).first();
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const rows = await db('users').insert({
      email: String(email).toLowerCase().trim(),
      password_hash,
      first_name,
      last_name,
      phone,
      role: PENDING_ROLE,
      status: 'active'
    }).returning('*');
    const { id } = rows[0];

    const token = jwt.sign(
      { id, email: String(email).toLowerCase().trim(), role: PENDING_ROLE },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: { id, email: String(email).toLowerCase().trim(), first_name, last_name, phone, role: PENDING_ROLE }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
