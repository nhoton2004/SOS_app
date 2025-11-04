// Load environment variables first
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const initializeDatabase = require('./config/initializeDatabase');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

const parseCorsOrigins = () => {
  if (!process.env.CORS_ORIGINS) {
    // Default: allow localhost:3000 for frontend admin dashboard
    return ['http://localhost:3000', 'http://localhost:5173'];
  }
  const origins = process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
  // Always include localhost:3000 for development
  if (!origins.includes('http://localhost:3000')) {
    origins.push('http://localhost:3000');
  }
  if (!origins.includes('http://localhost:5173')) {
    origins.push('http://localhost:5173');
  }
  return origins;
};

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Safe Connect API is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const startServer = async () => {
  try {
    await connectDB();
    await initializeDatabase();
    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
      // eslint-disable-next-line no-console
      console.log(`Server listening at http://${displayHost}:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

startServer();
