import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import restaurantsRoutes from './modules/restaurants/restaurants.routes';
import customersRoutes from './modules/customers/customers.routes';
import tablesRoutes from './modules/tables/tables.routes';
import environmentsRoutes from './modules/environments/environments.routes';
import shiftsRoutes from './modules/shifts/shifts.routes';
import reservationsRoutes from './modules/reservations/reservations.routes';
import subscriptionsRoutes from './modules/subscriptions/subscriptions.routes';
import adminRoutes from './modules/admin/admin.routes';
import paymentsRoutes from './modules/payments/payments.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// For Stripe webhooks, we need raw body
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/tables', tablesRoutes);
app.use('/api/environments', environmentsRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;

