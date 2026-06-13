require('dotenv').config();
const { connectDB } = require('../src/config/database');
const { User }      = require('../src/models');
const logger        = require('../src/utils/logger');

async function seed() {
  await connectDB();
  const email = process.env.ADMIN_EMAIL || 'admin@smsplatform.rw';
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    logger.info(`Admin already exists: ${email}`);
    process.exit(0);
  }
  await User.create({
    name:     process.env.ADMIN_NAME     || 'Administrator',
    email,
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  });
  logger.info(`✅ Admin created: ${email}`);
  logger.info(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
