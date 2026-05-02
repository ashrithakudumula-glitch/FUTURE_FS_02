const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/mongodb');

const validators = [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Name is required'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('message').trim().notEmpty().isLength({ max: 2000 }).withMessage('Message is required'),
  body('source').optional().trim().isLength({ max: 100 }),
  body('phone').optional().trim().isMobilePhone().withMessage('Invalid phone number'),
];

async function contactHandler(req, res) {
  for (const validator of validators) {
    await validator.run(req);
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();

    const lead = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone || '',
      message: req.body.message,
      source: req.body.source || 'website',
      status: 'new',
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection('leads').insertOne(lead);

    res.status(201).json({
      success: true,
      message: 'Thank you! We will be in touch soon.',
      leadId: result.insertedId.toString(),
    });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to submit. Please try again.' });
  }
}

module.exports = contactHandler;
