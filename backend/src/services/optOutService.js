const { Contact, IncomingReply } = require('../models');
const logger = require('../utils/logger');

// ── Keywords that trigger opt-out (case-insensitive, trimmed) ─────────────────
const OPT_OUT_KEYWORDS = [
  '1', 'stop', 'unsubscribe', 'optout', 'opt-out', 'opt out',
  'oya', 'simbyiyemeza', 'reka', 'hagarika', // common Kinyarwanda equivalents
];

const isOptOutMessage = (text) => {
  if (!text) return false;
  const clean = text.trim().toLowerCase();
  return OPT_OUT_KEYWORDS.includes(clean);
};

// ── Normalize phone the same way the rest of the app does ─────────────────────
const normalizePhone = (phone) => {
  let clean = phone.toString().replace(/\D/g, '');
  if (clean.startsWith('0') && clean.length === 10) clean = '250' + clean.slice(1);
  if (!clean.startsWith('250') && clean.length === 9) clean = '250' + clean;
  return '+' + clean;
};

// ── Process an inbound SMS reply (called from webhook) ────────────────────────
const processIncomingReply = async ({ from, text, raw }) => {
  const phone = normalizePhone(from);
  const optOut = isOptOutMessage(text);

  // Find matching contact(s) - a phone may exist under multiple companies
  const contacts = await Contact.findAll({ where: { phone } });

  // Log the reply regardless (audit trail)
  await IncomingReply.create({
    phone,
    contact_id: contacts[0]?.id || null,
    company_id: contacts[0]?.company_id || null,
    text,
    was_opt_out: optOut,
    raw_payload: raw || {},
  });

  if (!optOut) {
    logger.info(`📩 Reply from ${phone}: "${text}" (not an opt-out)`);
    return { optedOut: false, contactsUpdated: 0 };
  }

  // Mark ALL contacts with this phone number as opted out (across all companies)
  let updated = 0;
  for (const contact of contacts) {
    await contact.update({
      opted_out: true,
      opted_out_at: new Date(),
      opt_out_reason: `Replied "${text.trim()}"`,
      status: 'inactive',
    });
    updated++;
  }

  logger.info(`🚫 OPT-OUT: ${phone} opted out (${updated} contact record(s) updated)`);
  return { optedOut: true, contactsUpdated: updated };
};

// ── Append opt-out footer to outgoing messages ─────────────────────────────────
const OPT_OUT_FOOTER = '\n\nReply STOP to opt out.';

const appendOptOutFooter = (message, channel) => {
  // Only append to SMS (WhatsApp has its own opt-out via blocking)
  if (channel === 'WhatsApp') return message;
  if (message.includes('STOP') || message.includes('Reply STOP')) return message; // already has it
  return message + OPT_OUT_FOOTER;
};

module.exports = {
  isOptOutMessage,
  processIncomingReply,
  appendOptOutFooter,
  normalizePhone,
  OPT_OUT_KEYWORDS,
};
