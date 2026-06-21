import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';
import requestRoutes from './routes/requests';
import notificationRoutes from './routes/notifications';
import favoritesRoutes from './routes/favorites';
import contactsRoutes from './routes/contacts';
import providerRoutes from './routes/providers';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', searchRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api', providerRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`\n🚀 IworkG Backend rodando em http://localhost:${config.port}`);
    console.log(`📋 Health: http://localhost:${config.port}/api/health\n`);
  });
}

export default app;
