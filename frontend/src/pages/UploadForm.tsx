import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Template {
  id: string;
  name: string;
  description: string;
  start_row: number;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  rule: string;
}

const API_BASE = 'http://localhost:3001/api';

export default function UploadForm() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'pending' | 'valid' | 'invalid' | null>(null);

  // Fetch templates on mount
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await axios.get(`${API_BASE}/templates`);
        setTemplates(response.data);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };

    fetchTemplates();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setValidationErrors([]);
      setUploadStatus(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateId', selectedTemplate);

      const response = await axios.post(`${API_BASE}/uploads/validate`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.status === 'valid') {
        setSuccess(`✅ File is valid! Upload ID: ${response.data.uploadId}`);
        setUploadStatus('valid');
        setFile(null);
        setValidationErrors([]);
      } else {
        setUploadStatus('invalid');
        setValidationErrors(response.data.errors);
        setError(`❌ Found ${response.data.errorCount} validation errors`);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        setUploadStatus('invalid');
        setValidationErrors(err.response.data.errors);
        setError(`❌ Found ${err.response.data.errorCount} validation errors`);
      } else {
        setError(err.response?.data?.error || 'Failed to validate file');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-title">Upload & Validate Excel File</div>

        <form onSubmit={handleUpload}>
          <div className="form-group">
            <label>Select Template</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">-- Choose a template --</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                  {template.description && ` - ${template.description}`}
                </option>
              ))}
            </select>
            {templates.length === 0 && (
              <small style={{ color: '#f44336' }}>
                No templates found. Create one first! 📋
              </small>
            )}
          </div>

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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={!file || !selectedTemplate || loading}
          >
            {loading ? <span className="loading"></span> : '📤 Validate File'}
          </button>
        </form>
      </div>

      {uploadStatus === 'valid' && (
        <div className="card" style={{ background: '#c8e6c9', borderLeft: '4px solid #4CAF50' }}>
          <h3 style={{ color: '#2e7d32' }}>✅ Validation Passed</h3>
          <p>Your Excel file matches the template and has been saved successfully!</p>
        </div>
      )}

      {uploadStatus === 'invalid' && validationErrors.length > 0 && (
        <div className="card">
          <div className="card-title">Validation Errors</div>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Found <strong>{validationErrors.length}</strong> validation error{validationErrors.length !== 1 ? 's' : ''}
          </p>

          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Column</th>
                  <th>Value</th>
                  <th>Error</th>
                  <th>Rule</th>
                </tr>
              </thead>
              <tbody>
                {validationErrors.slice(0, 100).map((err, idx) => (
                  <tr key={idx}>
                    <td><strong>{err.row}</strong></td>
                    <td>{err.column}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {String(err.value).substring(0, 30)}
                    </td>
                    <td>{err.error}</td>
                    <td>
                      <span className="error-badge">{err.rule}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {validationErrors.length > 100 && (
              <small style={{ display: 'block', marginTop: '10px', color: '#999' }}>
                Showing first 100 of {validationErrors.length} errors
              </small>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px', color: '#856404' }}>
            <strong>💡 Tips to fix:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>Check that all required fields are filled</li>
              <li>Verify data types match the template (numbers, text, dates)</li>
              <li>Ensure values are within the specified ranges</li>
              <li>Check for duplicate values where uniqueness is required</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
