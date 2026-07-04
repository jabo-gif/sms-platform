const express = require('express');
const jwt     = require('jsonwebtoken');
const { Op }  = require('sequelize');
const cron    = require('node-cron');
const { User, Company, Contact, Message, IncomingReply } = require('../models');
const { authenticate, asyncHandler } = require('../middleware');
const { sendMessage, normalizePhone } = require('../services/messageService');
const { processIncomingReply } = require('../services/optOutService');
const logger = require('../utils/logger');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

  res.json({
    success: true,
    data: {
      token,
      user: { id: user.id, name: user.name, email: user.email, theme: user.theme },
    },
  });
}));

router.get('/auth/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user.id, name: req.user.name, email: req.user.email, theme: req.user.theme } });
}));

router.put('/auth/theme', authenticate, asyncHandler(async (req, res) => {
  const { theme } = req.body;
  await req.user.update({ theme });
  res.json({ success: true, data: { theme } });
}));

router.put('/auth/profile', authenticate, asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const update = {};
  if (name)     update.name  = name;
  if (email)    update.email = email;
  if (password) update.password = password;
  await req.user.update(update);
  res.json({ success: true, message: 'Profile updated' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// COMPANY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.get('/companies', authenticate, asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (search) where[Op.or] = [
    { name:    { [Op.iLike]: `%${search}%` } },
    { email:   { [Op.iLike]: `%${search}%` } },
    { phone:   { [Op.iLike]: `%${search}%` } },
    { industry:{ [Op.iLike]: `%${search}%` } },
  ];

  const { count, rows } = await Company.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['name', 'ASC']],
  });

  res.json({
    success: true,
    data: {
      companies: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
    },
  });
}));

router.get('/companies/all', authenticate, asyncHandler(async (req, res) => {
  const companies = await Company.findAll({
    where: { status: 'active' },
    attributes: ['id', 'name', 'industry', 'contact_count'],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: companies });
}));

router.post('/companies', authenticate, asyncHandler(async (req, res) => {
  const { name, phone, email, address, industry, notes } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Company name is required' });

  const company = await Company.create({ name, phone, email, address, industry, notes });
  res.status(201).json({ success: true, message: 'Company created', data: company });
}));

router.get('/companies/:id', authenticate, asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id, {
    include: [{ model: Contact, as: 'contacts', limit: 5, order: [['created_at', 'DESC']] }],
  });
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  res.json({ success: true, data: company });
}));

router.put('/companies/:id', authenticate, asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  await company.update(req.body);
  res.json({ success: true, message: 'Company updated', data: company });
}));

router.delete('/companies/:id', authenticate, asyncHandler(async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
  await company.destroy();
  res.json({ success: true, message: 'Company deleted' });
}));

// ─────────────────────────────────────────────────────────────────────────────
// CONTACT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.get('/contacts', authenticate, asyncHandler(async (req, res) => {
  const { company_id, search, opted_out, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (company_id) where.company_id = company_id;
  if (opted_out !== undefined) where.opted_out = opted_out === 'true';
  if (search) where[Op.or] = [
    { name:  { [Op.iLike]: `%${search}%` } },
    { phone: { [Op.iLike]: `%${search}%` } },
  ];

  const { count, rows } = await Contact.findAndCountAll({
    where,
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  res.json({
    success: true,
    data: {
      contacts: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
    },
  });
}));

router.get('/contacts/by-company/:companyId', authenticate, asyncHandler(async (req, res) => {
  // ✅ Excludes opted-out contacts automatically from send list
  const contacts = await Contact.findAll({
    where: { company_id: req.params.companyId, status: 'active', opted_out: false },
    attributes: ['id', 'phone', 'name'],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: contacts });
}));

router.post('/contacts', authenticate, asyncHandler(async (req, res) => {
  const { company_id, phone, name, email, location, notes } = req.body;
  if (!company_id) return res.status(400).json({ success: false, message: 'Company is required' });
  if (!phone)      return res.status(400).json({ success: false, message: 'Phone number is required' });

  const normalized = normalizePhone(phone);
  const existing = await Contact.findOne({ where: { company_id, phone: normalized } });
  if (existing) return res.status(409).json({ success: false, message: 'This phone number already exists in this company' });

  const contact = await Contact.create({ company_id, phone: normalized, name, email, location, notes });
  await Company.increment('contact_count', { where: { id: company_id } });

  res.status(201).json({ success: true, message: 'Contact added', data: contact });
}));

router.put('/contacts/:id', authenticate, asyncHandler(async (req, res) => {
  const contact = await Contact.findByPk(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  if (req.body.phone) req.body.phone = normalizePhone(req.body.phone);
  await contact.update(req.body);
  res.json({ success: true, message: 'Contact updated', data: contact });
}));

// ✅ NEW — Manually re-subscribe an opted-out contact
router.put('/contacts/:id/resubscribe', authenticate, asyncHandler(async (req, res) => {
  const contact = await Contact.findByPk(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  await contact.update({ opted_out: false, opted_out_at: null, opt_out_reason: null, status: 'active' });
  res.json({ success: true, message: 'Contact re-subscribed', data: contact });
}));

router.delete('/contacts/:id', authenticate, asyncHandler(async (req, res) => {
  const contact = await Contact.findByPk(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
  await contact.destroy();
  await Company.decrement('contact_count', { where: { id: contact.company_id } });
  res.json({ success: true, message: 'Contact deleted' });
}));

router.post('/contacts/bulk-delete', authenticate, asyncHandler(async (req, res) => {
  const { ids } = req.body;
  await Contact.destroy({ where: { id: ids } });
  res.json({ success: true, message: `${ids.length} contacts deleted` });
}));

// ─────────────────────────────────────────────────────────────────────────────
// OPT-OUT ROUTES (NEW)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/opt-outs — list everyone who opted out
router.get('/opt-outs', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, company_id } = req.query;
  const offset = (page - 1) * limit;
  const where = { opted_out: true };
  if (company_id) where.company_id = company_id;

  const { count, rows } = await Contact.findAndCountAll({
    where,
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['opted_out_at', 'DESC']],
  });

  res.json({
    success: true,
    data: {
      contacts: rows,
      pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) },
    },
  });
}));

// GET /api/opt-outs/replies — raw incoming reply log (audit trail)
router.get('/opt-outs/replies', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 30 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows } = await IncomingReply.findAndCountAll({
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  res.json({
    success: true,
    data: { replies: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } },
  });
}));

// ─── WEBHOOK — Africa's Talking sends incoming SMS replies here ───────────────
// Set this URL as your "Callback URL" in Africa's Talking dashboard:
//   https://yourdomain.rw/api/sms/incoming   (or ngrok URL while testing)
router.post('/sms/incoming', asyncHandler(async (req, res) => {
  // Africa's Talking sends: from, to, text, id, date, linkId
  const { from, text } = req.body;

  if (!from || !text) {
    logger.warn('⚠️  Incoming SMS webhook missing from/text');
    return res.sendStatus(200); // always 200 so AT doesn't retry forever
  }

  try {
    const result = await processIncomingReply({ from, text, raw: req.body });
    logger.info(`📲 Incoming SMS processed — optedOut: ${result.optedOut}`);
  } catch (err) {
    logger.error('Incoming SMS processing failed: ' + err.message);
  }

  // Africa's Talking expects a 200 response
  res.sendStatus(200);
}));

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE ROUTES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/messages/send', authenticate, asyncHandler(async (req, res) => {
  const { company_id, contact_ids, content, type, channel, scheduled_at } = req.body;

  if (!company_id)             return res.status(400).json({ success: false, message: 'Company is required' });
  if (!contact_ids?.length)    return res.status(400).json({ success: false, message: 'Select at least one contact' });
  if (!content?.trim())        return res.status(400).json({ success: false, message: 'Message content is required' });
  if (!type)                   return res.status(400).json({ success: false, message: 'Message type is required' });
  if (!channel)                return res.status(400).json({ success: false, message: 'Channel is required' });

  // ✅ Block sending to opted-out contacts — filter them out here too (defense in depth)
  const contacts = await Contact.findAll({ where: { id: contact_ids, status: 'active', opted_out: false } });

  const skippedCount = contact_ids.length - contacts.length;
  if (!contacts.length) {
    return res.status(404).json({ success: false, message: 'All selected contacts have opted out or are inactive' });
  }

  if (scheduled_at) {
    const scheduledMessages = await Message.bulkCreate(
      contacts.map(c => ({
        company_id, contact_id: c.id, phone: c.phone, contact_name: c.name,
        content, type, channel,
        scheduled_at: new Date(scheduled_at), is_scheduled: true,
        sms_status: 'pending', whatsapp_status: 'pending',
      }))
    );
    return res.json({
      success: true,
      message: `✅ ${contacts.length} messages scheduled${skippedCount ? ` (${skippedCount} skipped - opted out)` : ''}`,
      data: { count: scheduledMessages.length, scheduled_at, skipped: skippedCount },
    });
  }

  const results = { sent: 0, failed: 0, skipped: skippedCount, details: [] };

  for (const contact of contacts) {
    const result = await sendMessage({ phone: contact.phone, message: content, channel });

    const smsSent = result.sms?.success;
    const waSent  = result.whatsapp?.success;
    const anyFail = (channel === 'SMS' && !smsSent) || (channel === 'WhatsApp' && !waSent) || (channel === 'Both' && !smsSent && !waSent);

    await Message.create({
      company_id, contact_id: contact.id, phone: contact.phone, contact_name: contact.name,
      content, type, channel, is_scheduled: false,
      sms_status:      result.sms?.success      ? 'sent' : (channel === 'SMS' || channel === 'Both') ? 'failed' : 'pending',
      whatsapp_status: result.whatsapp?.success ? 'sent' : (channel === 'WhatsApp' || channel === 'Both') ? 'failed' : 'pending',
      sms_message_id:      result.sms?.messageId      || null,
      whatsapp_message_id: result.whatsapp?.messageId || null,
      error_message: result.sms?.error || result.whatsapp?.error || null,
      sent_at: new Date(),
    });

    if (anyFail) results.failed++; else results.sent++;
    results.details.push({
      phone: contact.phone, name: contact.name,
      sms: result.sms?.success ? '✅' : '❌',
      wa:  result.whatsapp?.success ? '✅' : (channel === 'WhatsApp' || channel === 'Both') ? '❌' : '—',
    });
  }

  res.json({
    success: true,
    message: `✅ Sent to ${results.sent} contacts${results.failed ? `, ❌ ${results.failed} failed` : ''}${skippedCount ? `, 🚫 ${skippedCount} skipped (opted out)` : ''}`,
    data: results,
  });
}));

router.get('/messages', authenticate, asyncHandler(async (req, res) => {
  const { company_id, type, channel, status, search, start_date, end_date, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (company_id) where.company_id = company_id;
  if (type)       where.type       = type;
  if (channel)    where.channel    = channel;
  if (search) {
    where[Op.or] = [
      { phone:        { [Op.iLike]: `%${search}%` } },
      { contact_name: { [Op.iLike]: `%${search}%` } },
      { content:      { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at[Op.gte] = new Date(start_date);
    if (end_date)   where.created_at[Op.lte] = new Date(end_date + 'T23:59:59');
  }
  if (status) where[Op.or] = [{ sms_status: status }, { whatsapp_status: status }];

  const { count, rows } = await Message.findAndCountAll({
    where,
    include: [{ model: Company, as: 'company', attributes: ['id', 'name'] }],
    limit: parseInt(limit), offset: parseInt(offset),
    order: [['created_at', 'DESC']],
  });

  res.json({
    success: true,
    data: { messages: rows, pagination: { total: count, page: parseInt(page), pages: Math.ceil(count / limit) } },
  });
}));

router.get('/messages/stats', authenticate, asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    totalCompanies, totalContacts, totalMessages, todayMessages, monthMessages,
    smsSent, waSent, failed, optedOutCount,
  ] = await Promise.all([
    Company.count({ where: { status: 'active' } }),
    Contact.count({ where: { status: 'active' } }),
    Message.count(),
    Message.count({ where: { created_at: { [Op.gte]: today } } }),
    Message.count({ where: { created_at: { [Op.gte]: thisMonth } } }),
    Message.count({ where: { sms_status: 'sent' } }),
    Message.count({ where: { whatsapp_status: 'sent' } }),
    Message.count({ where: { sms_status: 'failed' } }),
    Contact.count({ where: { opted_out: true } }),
  ]);

  const byType = await Message.findAll({
    attributes: ['type', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
    group: ['type'], raw: true,
  });

  const recent = await Message.findAll({
    limit: 5, order: [['created_at', 'DESC']],
    include: [{ model: Company, as: 'company', attributes: ['name'] }],
  });

  res.json({
    success: true,
    data: {
      stats: { totalCompanies, totalContacts, totalMessages, todayMessages, monthMessages, smsSent, waSent, failed, optedOutCount },
      byType, recent,
    },
  });
}));

router.delete('/messages/:id', authenticate, asyncHandler(async (req, res) => {
  await Message.destroy({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Message deleted' });
}));

// ─── Scheduled message processor ─────────────────────────────────────────────
const processScheduled = async () => {
  const now = new Date();
  const pending = await Message.findAll({
    where: { is_scheduled: true, scheduled_at: { [Op.lte]: now }, sms_status: 'pending' },
  });

  for (const msg of pending) {
    // ✅ Re-check opt-out status right before sending (in case they opted out after scheduling)
    const contact = msg.contact_id ? await Contact.findByPk(msg.contact_id) : null;
    if (contact?.opted_out) {
      await msg.update({ sms_status: 'failed', whatsapp_status: 'failed', error_message: 'Contact opted out before scheduled send', is_scheduled: false });
      logger.info(`🚫 Skipped scheduled message to ${msg.phone} — opted out`);
      continue;
    }

    const result = await sendMessage({ phone: msg.phone, message: msg.content, channel: msg.channel });
    await msg.update({
      sms_status:      result.sms?.success      ? 'sent' : msg.channel !== 'WhatsApp' ? 'failed' : 'pending',
      whatsapp_status: result.whatsapp?.success ? 'sent' : msg.channel !== 'SMS'      ? 'failed' : 'pending',
      sms_message_id:      result.sms?.messageId      || null,
      whatsapp_message_id: result.whatsapp?.messageId || null,
      sent_at: new Date(), is_scheduled: false,
    });
    logger.info(`📅 Scheduled message sent to ${msg.phone}`);
  }
};

cron.schedule('* * * * *', processScheduled);

module.exports = router;