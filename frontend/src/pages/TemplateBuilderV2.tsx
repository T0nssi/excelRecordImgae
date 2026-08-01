import React, { useState } from 'react';
import axios from 'axios';

interface Rule {
  type: 'cell' | 'row-range';
  cellAddress?: string;
  startRow?: number;
  endRow?: number;
  columnLetter?: string;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  minValue?: number;
  maxValue?: number;
  maxLength?: number;
  description?: string;
}

interface PreviewData {
  headers: string[];
  data: Record<string, any>[];
  totalRows: number;
}

const API_BASE = 'http://localhost:3001/api';

export default function TemplateBuilderV2() {
  const [file, setFile] = useState<File | null>(null);
  const [startRow, setStartRow] = useState(1);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(null);
      setRules([]);
    }
  };

  const handlePreview = async () => {
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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview');
    } finally {
      setLoading(false);
    }
  };

  const addRule = () => {
    setRules([...rules, {
      type: 'cell',
      cellAddress: 'A1',
      dataType: 'text',
      required: false
    }]);
  };

  const updateRule = (idx: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[idx] = { ...newRules[idx], [field]: value };
    setRules(newRules);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const handleCreateTemplate = async () => {
    if (!templateName) {
      setError('Template name required');
      return;
    }
    if (rules.length === 0) {
      setError('Add at least one rule');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_BASE}/templates`, {
        name: templateName,
        description: templateDesc,
        startRow,
        rules
      });

      setSuccess('✅ Template created!');
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setRules([]);
        setTemplateName('');
        setTemplateDesc('');
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-2">
      {/* Upload & Preview */}
      <div className="card">
        <div className="card-title">1. Upload & Preview</div>

        <div className="form-group">
          <label>Select Excel File</label>
          <div className="upload-area" onClick={() => document.querySelector('input[type="file"]')?.click()}>
            <div className="upload-icon">📁</div>
            <p><strong>Click to upload</strong></p>
            <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </div>
          {file && <small>{file.name}</small>}
        </div>

        <div className="form-group">
          <label>Start Row</label>
          <input
            type="number"
            min="1"
            value={startRow}
            onChange={(e) => setStartRow(parseInt(e.target.value))}
          />
        </div>

        <button className="btn btn-primary" onClick={handlePreview} disabled={!file || loading}>
          {loading ? '⏳' : '👁️'} Preview
        </button>

        {preview && (
          <div style={{ marginTop: '16px' }}>
            <div className="card-title">Data Preview</div>
            <div className="table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    {preview.headers.map((h, i) => (
                      <th key={i}>
                        {h}
                        <div className="resize-handle"></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.data.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {preview.headers.map((h, i) => (
                        <td key={i}>{String(row[h] || '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <small>Showing first 5 of {preview.totalRows} rows</small>
          </div>
        )}
      </div>

      {/* Rules Configuration */}
      <div className="card">
        <div className="card-title">2. Define Rules</div>

        <div className="form-group">
          <label>Template Name</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Sales Report"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={templateDesc}
            onChange={(e) => setTemplateDesc(e.target.value)}
            placeholder="What is this template for?"
            rows={2}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '14px' }}>Validation Rules</strong>
            <button className="btn btn-ghost" onClick={addRule} style={{ fontSize: '12px' }}>
              + Add Rule
            </button>
          </div>

          {rules.map((rule, idx) => (
            <div key={idx} className="rule-box">
              <select value={rule.type} onChange={(e) => updateRule(idx, 'type', e.target.value)}>
                <option value="cell">Single Cell</option>
                <option value="row-range">Row Range</option>
              </select>

              {rule.type === 'cell' ? (
                <input
                  type="text"
                  value={rule.cellAddress || ''}
                  onChange={(e) => updateRule(idx, 'cellAddress', e.target.value)}
                  placeholder="A1"
                />
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={rule.startRow || ''}
                    onChange={(e) => updateRule(idx, 'startRow', parseInt(e.target.value))}
                    placeholder="From"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="number"
                    value={rule.endRow || ''}
                    onChange={(e) => updateRule(idx, 'endRow', parseInt(e.target.value))}
                    placeholder="To"
                    style={{ flex: 1 }}
                  />
                </div>
              )}

              <select value={rule.dataType} onChange={(e) => updateRule(idx, 'dataType', e.target.value)}>
                <option>Text</option>
                <option>Number</option>
                <option>Date</option>
              </select>

              <div style={{ display: 'flex', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                  <input
                    type="checkbox"
                    checked={rule.required}
                    onChange={(e) => updateRule(idx, 'required', e.target.checked)}
                  />
                  Req
                </label>
              </div>

              <button className="btn btn-danger" onClick={() => removeRule(idx)} style={{ fontSize: '12px' }}>
                ✕
              </button>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">❌ {error}</div>}
        {success && <div className="alert alert-success">✅ {success}</div>}

        <button className="btn btn-success" onClick={handleCreateTemplate} disabled={loading || !templateName}>
          {loading ? '⏳' : '✅'} Create Template
        </button>
      </div>
    </div>
  );
}
