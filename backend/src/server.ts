import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { requireAuth } from './middleware/auth';
import authRoutes from './routes/auth';
import searchRoutes from './routes/search';

const app = express();

// Middleware
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth, searchRoutes);

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
