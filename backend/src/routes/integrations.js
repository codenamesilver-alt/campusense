const express = require('express');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not configured');
  }
  return createClient(url, key);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

const BUCKET = 'school-uploads';

// UploadFile
router.post('/UploadFile', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const pathMod = require('path');
    const ext = pathMod.extname(req.file.originalname);
    const name = pathMod.basename(req.file.originalname, ext).replace(/[^a-z0-9_-]/gi, '_');
    const filePath = `${Date.now()}_${name}${ext}`;

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

    res.json({
      file_url: urlData.publicUrl,
      name: req.file.originalname,
      size: req.file.size
    });
  } catch (err) {
    console.error('[UploadFile] Error:', err.message);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

// InvokeLLM - stub (no real LLM)
router.post('/InvokeLLM', authenticate, (req, res) => {
  res.json({
    message: 'LLM integration not available in local deployment. This is a stub response.',
    data: null
  });
});

// SendEmail - stub (log only)
router.post('/SendEmail', authenticate, (req, res) => {
  console.log('[SendEmail] (stub)', { to: req.body.to, subject: req.body.subject });
  res.json({ success: true, message: 'Email not actually sent (stub)' });
});

// SendSMS - stub
router.post('/SendSMS', authenticate, (req, res) => {
  console.log('[SendSMS] (stub)', { to: req.body.to, body: req.body.body });
  res.json({ success: true, message: 'SMS not actually sent (stub)' });
});

// GenerateImage - stub
router.post('/GenerateImage', authenticate, (req, res) => {
  res.json({ image_url: null, message: 'Image generation not available in local deployment (stub)' });
});

// ExtractDataFromUploadedFile - stub
router.post('/ExtractDataFromUploadedFile', authenticate, upload.single('file'), (req, res) => {
  res.json({ data: null, message: 'OCR extraction not available (stub)' });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
