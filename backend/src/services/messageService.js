const AfricasTalking = require('africastalking');
const axios = require('axios');
const logger = require('../utils/logger');
const { appendOptOutFooter, normalizePhone } = require('./optOutService');

// ─── Africa's Talking SMS ─────────────────────────────────────────────────────
let atSMS = null;

const getATClient = () => {
  if (!atSMS) {
    const at = AfricasTalking({
      apiKey:   process.env.AT_API_KEY   || 'dummy',
      username: process.env.AT_USERNAME  || 'sandbox',
    });
    atSMS = at.SMS;
  }
  return atSMS;
};

const sendSMS = async (to, message) => {
  try {
    const sms = getATClient();
    const phone = normalizePhone(to);
    const res = await sms.send({
      to: [phone],
      message,
      enqueue: true,
    });
    const recipient = res.SMSMessageData?.Recipients?.[0];
    if (recipient?.status === 'Success') {
      logger.info(`✅ SMS sent to ${phone}: ${recipient.messageId}`);
      return { success: true, messageId: recipient.messageId, network: recipient.network };
    }
    throw new Error(recipient?.status || 'SMS send failed');
  } catch (err) {
    logger.error(`❌ SMS failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ─── WhatsApp Meta Cloud API ──────────────────────────────────────────────────
const sendWhatsApp = async (to, message) => {
  const token   = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    logger.warn('⚠️  WhatsApp not configured');
    return { success: false, error: 'WhatsApp not configured' };
  }

  try {
    const phone = normalizePhone(to).replace('+', '');
    const res = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const messageId = res.data?.messages?.[0]?.id;
    logger.info(`✅ WhatsApp sent to ${phone}: ${messageId}`);
    return { success: true, messageId };
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    logger.error(`❌ WhatsApp failed to ${to}: ${errMsg}`);
    return { success: false, error: errMsg };
  }
};

// ─── Send via channel — auto-adds opt-out footer to SMS ───────────────────────
const sendMessage = async ({ phone, message, channel }) => {
  const result = { sms: null, whatsapp: null };
  const finalMessage = appendOptOutFooter(message, channel);

  if (channel === 'SMS' || channel === 'Both') {
    result.sms = await sendSMS(phone, finalMessage);
  }
  if (channel === 'WhatsApp' || channel === 'Both') {
    result.whatsapp = await sendWhatsApp(phone, message); // no footer needed on WA
  }

  return result;
};

module.exports = { sendMessage, sendSMS, sendWhatsApp, normalizePhone };