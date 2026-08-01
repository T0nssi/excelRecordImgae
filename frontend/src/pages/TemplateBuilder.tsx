import React, { useState } from 'react';
import axios from 'axios';

interface Preview {
  headers: string[];
  data: Record<string, any>[];
  totalRows: number;
}

interface Rule {
  columnName: string;
  columnLetter: string;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  format?: string;
  uniqueValues: boolean;
}

const API_BASE = 'http://localhost:3001/api';

export default function TemplateBuilder() {
  const [file, setFile] = useState<File | null>(null);
  const [startRow, setStartRow] = useState(1);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(null);
      setRules([]);
      setError('');
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('startRow', String(startRow));

      const response = await axios.post(`${API_BASE}/uploads/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setPreview(response.data.preview);

      // Initialize rules based on headers
      const initialRules = response.data.preview.headers.map((header: string, index: number) => ({
        columnName: header,
        columnLetter: String.fromCharCode(65 + index),
        dataType: 'text' as const,
        required: false,
        uniqueValues: false
      }));

      setRules(initialRules);
      setSuccess('File preview loaded! Now configure the rules below.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview file');
    } finally {
      setLoading(false);
    }
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateName) {
      setError('Template name is required');
      return;
    }

    if (rules.length === 0) {
      setError('Please define at least one rule');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/templates`, {
        name: templateName,
        description,
        startRow,
        rules
      });

      setSuccess('✅ Template created successfully!');
      setFile(null);
      setPreview(null);
      setRules([]);
      setTemplateName('');
      setDescription('');
      setStartRow(1);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">❌ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <div className="card">
        <div className="card-title">Step 1: Upload Sample Excel File</div>

        <form onSubmit={handlePreview}>
          <div className="form-group">
            <label>Excel File</label>
            <div className="upload-area" onClick={() => document.querySelector('input[type="file"]')?.click()}>
              <div className="upload-icon">📁</div>
              <p><strong>Click to upload</strong> or drag and drop</p>
              <p style={{ fontSize: '12px', color: '#999' }}>Excel files only</p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
            {file && <small>Selected: {file.name}</small>}
          </div>

          <div className="form-group">
            <label>Start Row (1-indexed)</label>
            <input
              type="number"
              min="1"
              value={startRow}
              onChange={(e) => setStartRow(parseInt(e.target.value))}
            />
            <small>Which row contains your headers? (Default: 1)</small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={!file || loading}>
            {loading ? <span className="loading"></span> : '👁️ Preview'}
          </button>
        </form>
      </div>

      {preview && (
        <div className="card">
          <div className="card-title">Step 2: Configure Validation Rules</div>

          <div className="preview-table">
            <table>
              <thead>
                <tr>
                  {preview.headers.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.slice(0, 5).map((row, idx) => (
                  <tr key={idx}>
                    {preview.headers.map((header, colIdx) => (
                      <td key={colIdx}>{String(row[header] || '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <small style={{ display: 'block', marginTop: '10px', color: '#999' }}>
              Showing first 5 rows of {preview.totalRows} total
            </small>
          </div>

          <form onSubmit={handleCreateTemplate} style={{ marginTop: '30px' }}>
            <div className="form-group">
              <label>Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Sales Report Template"
              />
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template is for..."
                rows={3}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Column Rules</h3>
              {rules.map((rule, idx) => (
                <div key={idx} className="rule-row">
                  <div>
                    <strong>{rule.columnName}</strong>
                    <div style={{ fontSize: '12px', color: '#999' }}>Column {rule.columnLetter}</div>
                  </div>

                  <select
                    value={rule.dataType}
                    onChange={(e) => updateRule(idx, 'dataType', e.target.value)}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="boolean">Boolean</option>
                  </select>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px' }}>
                      <input
                        type="checkbox"
                        checked={rule.required}
                        onChange={(e) => updateRule(idx, 'required', e.target.checked)}
                      />
                      Required
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '14px', marginTop: '5px' }}>
                      <input
                        type="checkbox"
                        checked={rule.uniqueValues}
                        onChange={(e) => updateRule(idx, 'uniqueValues', e.target.checked)}
                      />
                      Unique
                    </label>
                  </div>

                  <div>
                    {rule.dataType === 'number' && (
                      <>
                        <input
                          type="number"
                          placeholder="Min"
                          value={rule.minValue || ''}
                          onChange={(e) => updateRule(idx, 'minValue', e.target.value ? parseInt(e.target.value) : undefined)}
                          style={{ marginBottom: '5px' }}
                        />
                        <input
                          type="number"
                          placeholder="Max"
                          value={rule.maxValue || ''}
                          onChange={(e) => updateRule(idx, 'maxValue', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </>
                    )}
                    {rule.dataType === 'text' && (
                      <input
                        type="number"
                        placeholder="Max Length"
                        value={rule.maxLength || ''}
                        onChange={(e) => updateRule(idx, 'maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setRules(rules.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-success" disabled={!templateName || loading}>
              {loading ? <span className="loading"></span> : '✅ Create Template'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
