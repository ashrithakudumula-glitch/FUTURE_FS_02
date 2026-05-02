const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { ObjectId } = require('mongodb');
const { getDb } = require('../config/mongodb');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All leads routes require authentication
router.use(verifyToken);

const validateStatus = body('status')
  .isIn(['new', 'contacted', 'converted', 'lost'])
  .withMessage('Status must be: new, contacted, converted, or lost');

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

function toId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

// GET /api/leads/analytics/summary — must come before /:id route
router.get('/analytics/summary', async (req, res) => {
  try {
    const db = getDb();
    const leads = await db.collection('leads').find({}).toArray();

    const summary = {
      total: leads.length,
      new: leads.filter(l => l.status === 'new').length,
      contacted: leads.filter(l => l.status === 'contacted').length,
      converted: leads.filter(l => l.status === 'converted').length,
      lost: leads.filter(l => l.status === 'lost').length,
      conversionRate: leads.length
        ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
        : 0,
      bySource: leads.reduce((acc, l) => {
        acc[l.source] = (acc[l.source] || 0) + 1;
        return acc;
      }, {}),
    };

    res.json(summary);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/leads — list all leads with optional filters
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const filter = {};
    const { status, source, search } = req.query;

    if (status) filter.status = status;
    if (source) filter.source = source;

    let leads = await db.collection('leads')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Map _id → id for consistent API shape
    leads = leads.map(l => ({ ...l, id: l._id.toString() }));

    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.message?.toLowerCase().includes(q)
      );
    }

    res.json({ leads, total: leads.length });
  } catch (err) {
    console.error('GET /leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// POST /api/leads — create a lead manually
router.post(
  '/',
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().trim(),
    body('message').optional().trim().isLength({ max: 2000 }),
    body('source').optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const db = getDb();
      const now = new Date().toISOString();
      const lead = {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone || '',
        message: req.body.message || '',
        source: req.body.source || 'manual',
        status: 'new',
        createdAt: now,
        updatedAt: now,
      };
      const result = await db.collection('leads').insertOne(lead);
      res.status(201).json({ success: true, leadId: result.insertedId.toString() });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create lead' });
    }
  }
);

// GET /api/leads/:id — single lead with notes
router.get('/:id', param('id').notEmpty(), async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db = getDb();
    const _id = toId(req.params.id);
    if (!_id) return res.status(404).json({ error: 'Lead not found' });

    const lead = await db.collection('leads').findOne({ _id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const notes = await db.collection('notes')
      .find({ leadId: req.params.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      ...lead,
      id: lead._id.toString(),
      notes: notes.map(n => ({ ...n, id: n._id.toString() })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

// PATCH /api/leads/:id/status
router.patch(
  '/:id/status',
  [param('id').notEmpty(), validateStatus],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const db = getDb();
      const _id = toId(req.params.id);
      if (!_id) return res.status(404).json({ error: 'Lead not found' });

      const result = await db.collection('leads').updateOne(
        { _id },
        { $set: { status: req.body.status, updatedAt: new Date().toISOString(), updatedBy: req.user.email } }
      );

      if (result.matchedCount === 0) return res.status(404).json({ error: 'Lead not found' });
      res.json({ success: true, status: req.body.status });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update status' });
    }
  }
);

// POST /api/leads/:id/notes
router.post(
  '/:id/notes',
  [param('id').notEmpty(), body('content').trim().notEmpty().isLength({ max: 1000 })],
  async (req, res) => {
    if (!handleValidation(req, res)) return;
    try {
      const db = getDb();
      const _id = toId(req.params.id);
      if (!_id) return res.status(404).json({ error: 'Lead not found' });

      const lead = await db.collection('leads').findOne({ _id });
      if (!lead) return res.status(404).json({ error: 'Lead not found' });

      const now = new Date().toISOString();
      const note = {
        leadId: req.params.id,
        content: req.body.content,
        createdAt: now,
        author: req.user.email,
      };

      const result = await db.collection('notes').insertOne(note);
      await db.collection('leads').updateOne({ _id }, { $set: { updatedAt: now } });

      res.status(201).json({ ...note, id: result.insertedId.toString() });
    } catch (err) {
      res.status(500).json({ error: 'Failed to add note' });
    }
  }
);

// DELETE /api/leads/:id
router.delete('/:id', param('id').notEmpty(), async (req, res) => {
  if (!handleValidation(req, res)) return;
  try {
    const db = getDb();
    const _id = toId(req.params.id);
    if (!_id) return res.status(404).json({ error: 'Lead not found' });

    const result = await db.collection('leads').deleteOne({ _id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Lead not found' });

    // Delete associated notes
    await db.collection('notes').deleteMany({ leadId: req.params.id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

module.exports = router;
