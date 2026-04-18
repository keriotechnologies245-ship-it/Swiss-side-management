import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares (Anti-Vibe-Coding)
app.use(helmet()); // Secure HTTP headers
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Restrict CORS
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Express built-in body parsing
app.use(express.json({ limit: '10kb' })); // Mitigate large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiter to all api routes
app.use('/api', limiter);

// Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[Server] Running tightly secured API on port ${PORT}`);
});
