const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const opts = { timestamps: true, underscored: true };

// ─── User ─────────────────────────────────────────────────────────────────────
const User = sequelize.define('User', {
  id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:     { type: DataTypes.STRING(100), allowNull: false },
  email:    { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  theme:    { type: DataTypes.ENUM('dark','light'), defaultValue: 'dark' },
}, { ...opts, tableName: 'users',
  hooks: {
    beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
    beforeUpdate: async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12); },
  },
});
User.prototype.comparePassword = function(c) { return bcrypt.compare(c, this.password); };

// ─── Company ──────────────────────────────────────────────────────────────────
const Company = sequelize.define('Company', {
  id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name:          { type: DataTypes.STRING(150), allowNull: false },
  phone:         { type: DataTypes.STRING(20),  allowNull: true },
  email:         { type: DataTypes.STRING(150), allowNull: true },
  address:       { type: DataTypes.TEXT,        allowNull: true },
  industry:      { type: DataTypes.STRING(100), defaultValue: 'Other' },
  notes:         { type: DataTypes.TEXT,        allowNull: true },
  status:        { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
  contact_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { ...opts, tableName: 'companies' });

// ─── Contact ──────────────────────────────────────────────────────────────────
const Contact = sequelize.define('Contact', {
  id:         { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id: { type: DataTypes.UUID, allowNull: false },
  phone:      { type: DataTypes.STRING(20),  allowNull: false },
  name:       { type: DataTypes.STRING(100), allowNull: true },
  email:      { type: DataTypes.STRING(150), allowNull: true },
  location:   { type: DataTypes.STRING(100), allowNull: true },
  notes:      { type: DataTypes.TEXT,        allowNull: true },
  status:     { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { ...opts, tableName: 'contacts' });

// ─── Message ──────────────────────────────────────────────────────────────────
const Message = sequelize.define('Message', {
  id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  company_id:          { type: DataTypes.UUID, allowNull: false },
  contact_id:          { type: DataTypes.UUID, allowNull: true },
  phone:               { type: DataTypes.STRING(20),  allowNull: false },
  contact_name:        { type: DataTypes.STRING(100), allowNull: true },
  content:             { type: DataTypes.TEXT,        allowNull: false },
  type: {
    type: DataTypes.ENUM('Promotion','Alert','Update','Announcement','OTP',
      'Payment Reminder','Delivery Update','Welcome','Other'),
    defaultValue: 'Update',
  },
  channel:             { type: DataTypes.ENUM('SMS','WhatsApp','Both'), defaultValue: 'SMS' },
  scheduled_at:        { type: DataTypes.DATE,    allowNull: true },
  is_scheduled:        { type: DataTypes.BOOLEAN, defaultValue: false },
  sms_status:          { type: DataTypes.ENUM('pending','sent','delivered','failed'), defaultValue: 'pending' },
  whatsapp_status:     { type: DataTypes.ENUM('pending','sent','delivered','read','failed'), defaultValue: 'pending' },
  sms_message_id:      { type: DataTypes.STRING(100), allowNull: true },
  whatsapp_message_id: { type: DataTypes.STRING(100), allowNull: true },
  error_message:       { type: DataTypes.TEXT, allowNull: true },
  sent_at:             { type: DataTypes.DATE, allowNull: true },
}, { ...opts, tableName: 'messages' });

// ─── Associations ─────────────────────────────────────────────────────────────
Company.hasMany(Contact, { foreignKey: 'company_id', as: 'contacts', onDelete: 'CASCADE' });
Contact.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Company.hasMany(Message, { foreignKey: 'company_id', as: 'messages' });
Message.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
Contact.hasMany(Message, { foreignKey: 'contact_id', as: 'messages' });
Message.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

module.exports = { User, Company, Contact, Message };