import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import templatesRouter from './routes/templates';
import uploadsRouter from './routes/uploads';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/templates', templatesRouter);
app.use('/api/uploads', uploadsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📝 API endpoints:');
  console.log('  POST   /api/templates - Create template');
  console.log('  GET    /api/templates - List templates');
  console.log('  GET    /api/templates/:id - Get template');
  console.log('  DELETE /api/templates/:id - Delete template');
  console.log('  POST   /api/uploads/preview - Preview Excel file');
  console.log('  POST   /api/uploads/validate - Upload and validate');
  console.log('  GET    /api/uploads/:uploadId - Get upload details');
  console.log('  GET    /api/uploads/:uploadId/download - Download file');
});
