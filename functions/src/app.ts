import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth';
import bookingsRoutes from './routes/bookings';
import categoriesRoutes from './routes/categories';
import providersRoutes from './routes/providers';
import requestsRoutes from './routes/requests';
import usersRoutes from './routes/users';

const app = express();

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  /^https:\/\/.*\.web\.app$/,
  /^https:\/\/.*\.firebaseapp\.com$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const ok = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin),
      );
      callback(null, ok);
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/bookings', bookingsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Nie znaleziono' });
});

export default app;
