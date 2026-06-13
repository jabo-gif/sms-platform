require('dotenv').config();
require('express-async-errors');

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const morgan      = require('morgan');

const { connectDB }   = require('./config/database');
const routes          = require('./routes');
const { errorHandler }= require('./middleware');
const logger          = require('./utils/logger');

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', time: new Date().toISOString() });
});

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    logger.info('🚀 ================================================');
    logger.info('🚀  SMS Platform Server Running!');
    logger.info(`🚀  Port: ${PORT}`);
    logger.info(`🚀  API:  http://localhost:${PORT}/api`);
    logger.info('🚀 ================================================');
  });
};

start();
