import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface CreateTemplateRequest {
  name: string;
  description?: string;
  startRow: number;
  rules: Array<{
    columnName: string;
    columnLetter: string;
    dataType: 'text' | 'number' | 'date' | 'boolean';
    required?: boolean;
    minValue?: number;
    maxValue?: number;
    maxLength?: number;
    format?: string;
    uniqueValues?: boolean;
  }>;
}

// Create template
router.post('/', async (req: Request, res: Response) => {
  const { name, description, startRow, rules } = req.body as CreateTemplateRequest;

  if (!name || !rules || !Array.isArray(rules)) {
    res.status(400).json({ error: 'Name and rules array are required' });
    return;
  }

  try {
    const templateId = uuidv4();

    // Insert template
    await pool.query(
      'INSERT INTO templates (id, name, description, start_row) VALUES ($1, $2, $3, $4)',
      [templateId, name, description || null, startRow || 1]
    );

    // Insert rules
    for (const rule of rules) {
      await pool.query(
        `INSERT INTO template_rules
         (id, template_id, column_name, column_letter, data_type, required, min_value, max_value, max_length, format, unique_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          uuidv4(),
          templateId,
          rule.columnName,
          rule.columnLetter,
          rule.dataType,
          rule.required || false,
          rule.minValue || null,
          rule.maxValue || null,
          rule.maxLength || null,
          rule.format || null,
          rule.uniqueValues || false
        ]
      );
    }

    res.status(201).json({
      id: templateId,
      name,
      description,
      startRow,
      rulesCount: rules.length,
      message: 'Template created successfully'
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Template name already exists' });
    } else {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
});

// Get all templates
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, name, description, start_row, created_at FROM templates ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template with rules
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const templateResult = await pool.query(
      'SELECT id, name, description, start_row, created_at FROM templates WHERE id = $1',
      [id]
    );

    if (templateResult.rows.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    const rulesResult = await pool.query(
      'SELECT column_name, column_letter, data_type, required, min_value, max_value, max_length, format, unique_values FROM template_rules WHERE template_id = $1 ORDER BY column_letter',
      [id]
    );

    const template = templateResult.rows[0];
    template.rules = rulesResult.rows;

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Delete template
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM templates WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
