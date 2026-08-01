import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: 'postgres',
});

const initDb = async () => {
  try {
    console.log('🔧 Initializing database...');

    const dbName = process.env.DB_NAME || 'excel_validator';

    // Create database if not exists
    await pool.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✓ Database ${dbName} ready`);

    // Connect to the new database
    await pool.end();

    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: dbName,
    });

    // Create tables
    const queries = [
      // Templates table
      `CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        start_row INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Template rules table
      `CREATE TABLE IF NOT EXISTS template_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
        column_name VARCHAR(255) NOT NULL,
        column_letter VARCHAR(2) NOT NULL,
        data_type VARCHAR(50) NOT NULL,
        required BOOLEAN DEFAULT FALSE,
        min_value NUMERIC,
        max_value NUMERIC,
        max_length INTEGER,
        format VARCHAR(255),
        unique_values BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(template_id, column_letter)
      )`,

      // Uploads table
      `CREATE TABLE IF NOT EXISTS uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID NOT NULL REFERENCES templates(id),
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        version INTEGER DEFAULT 1,
        cloned_from_id UUID REFERENCES uploads(id),
        uploaded_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Validation results table
      `CREATE TABLE IF NOT EXISTS validation_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
        row_number INTEGER NOT NULL,
        column_name VARCHAR(255) NOT NULL,
        cell_value VARCHAR(500),
        error_message TEXT NOT NULL,
        rule_violated VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Images table
      `CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INTEGER,
        uploaded_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of queries) {
      await dbPool.query(query);
    }

    console.log('✓ All tables created successfully');
    await dbPool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
};

initDb();
