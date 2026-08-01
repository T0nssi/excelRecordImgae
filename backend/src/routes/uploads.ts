import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { excelValidator } from '../services/excelValidator';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Get preview of Excel file
router.post('/preview', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const startRow = req.body.startRow ? parseInt(req.body.startRow) : 1;

  try {
    const preview = await excelValidator.getPreview(req.file.path, startRow);

    // Clean up temp file after preview
    fs.unlinkSync(req.file.path);

    res.json({
      filename: req.file.originalname,
      preview,
      detectedColumns: preview.headers.length
    });
  } catch (error: any) {
    if (req.file) fs.unlinkSync(req.file.path);
    console.error('Error previewing file:', error);
    res.status(500).json({ error: error.message || 'Failed to preview file' });
  }
});

// Upload and validate Excel against template
router.post('/validate', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const { templateId } = req.body;

  if (!templateId) {
    fs.unlinkSync(req.file.path);
    res.status(400).json({ error: 'templateId is required' });
    return;
  }

  try {
    // Get template and rules
    const templateResult = await pool.query(
      'SELECT id, start_row FROM templates WHERE id = $1',
      [templateId]
    );

    if (templateResult.rows.length === 0) {
      fs.unlinkSync(req.file.path);
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const template = templateResult.rows[0];

    const rulesResult = await pool.query(
      'SELECT column_name, column_letter, data_type, required, min_value, max_value, max_length, format, unique_values FROM template_rules WHERE template_id = $1',
      [templateId]
    );

    const rules = rulesResult.rows;

    // Validate file
    const validationErrors = await excelValidator.validateFile(
      req.file.path,
      rules,
      template.start_row
    );

    if (validationErrors.length === 0) {
      // Save to database if valid
      const uploadId = uuidv4();
      await pool.query(
        'INSERT INTO uploads (id, template_id, filename, file_path, status) VALUES ($1, $2, $3, $4, $5)',
        [uploadId, templateId, req.file.originalname, req.file.path, 'valid']
      );

      res.json({
        uploadId,
        filename: req.file.originalname,
        status: 'valid',
        errors: [],
        message: 'File is valid and has been saved'
      });
    } else {
      // Save invalid file for reference
      const uploadId = uuidv4();
      await pool.query(
        'INSERT INTO uploads (id, template_id, filename, file_path, status) VALUES ($1, $2, $3, $4, $5)',
        [uploadId, templateId, req.file.originalname, req.file.path, 'invalid']
      );

      // Save validation errors
      for (const error of validationErrors) {
        await pool.query(
          'INSERT INTO validation_results (id, upload_id, row_number, column_name, cell_value, error_message, rule_violated) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [uuidv4(), uploadId, error.row, error.column, String(error.value), error.error, error.rule]
        );
      }

      res.status(400).json({
        uploadId,
        filename: req.file.originalname,
        status: 'invalid',
        errorCount: validationErrors.length,
        errors: validationErrors.slice(0, 50) // Return first 50 errors
      });
    }
  } catch (error: any) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    console.error('Error validating file:', error);
    res.status(500).json({ error: error.message || 'Failed to validate file' });
  }
});

// Get upload details
router.get('/:uploadId', async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  try {
    const uploadResult = await pool.query(
      'SELECT id, template_id, filename, status, uploaded_at FROM uploads WHERE id = $1',
      [uploadId]
    );

    if (uploadResult.rows.length === 0) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }

    const upload = uploadResult.rows[0];

    const errorsResult = await pool.query(
      'SELECT row_number, column_name, cell_value, error_message, rule_violated FROM validation_results WHERE upload_id = $1 ORDER BY row_number, column_name',
      [uploadId]
    );

    upload.errors = errorsResult.rows;

    res.json(upload);
  } catch (error) {
    console.error('Error fetching upload:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Download original file
router.get('/:uploadId/download', async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  try {
    const uploadResult = await pool.query(
      'SELECT filename, file_path FROM uploads WHERE id = $1',
      [uploadId]
    );

    if (uploadResult.rows.length === 0) {
      res.status(404).json({ error: 'Upload not found' });
      return;
    }

    const { filename, file_path } = uploadResult.rows[0];

    res.download(file_path, filename);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

export default router;
