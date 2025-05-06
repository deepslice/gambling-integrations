import express from 'express';

import v1ExternalRoutes from './routes/v1/external/walletRoutes.js';
import v1InternalRoutes from './routes/v1/internal/gmaeInitRoutes.js';

const app = express();

// Middleware (если нужно разделять Internal/External)
app.use((req, res, next) => {
  console.log('Global middleware');
  next();
});

// External API (v1)
app.use('/api/v1', v1ExternalRoutes);

// Internal API (v1) – можно добавить проверку доступа (например, IP или API-Key)
app.use('/api/v1/internal', v1InternalRoutes);

// External API (v2)
// app.use('/api/v2', v2ExternalRoutes);

export default app;
