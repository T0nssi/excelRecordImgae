import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Template {
  id: string;
  name: string;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
}

const API_BASE = 'http://localhost:3001/api';

export default function FileUploaderV2() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'none' | 'valid' | 'invalid' | 'loading'>('none');

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/templates`);
        setTemplates(data);
      } catch (err) {
        console.error('Failed to fetch templates');
      }
    };
    fetchTemplates();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
    setUploadStatus('none');
    setErrors([]);
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles(selected);
    setUploadStatus('none');
  };

  const handleUpload = async () => {
    if (!files.length || !selectedTemplate) {
      return;
    }

    setLoading(true);
    setUploadStatus('loading');

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('templateId', selectedTemplate);
        formData.append('folderName', folderName || 'General');

        const response = await axios.post(`${API_BASE}/uploads/validate`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (response.data.status === 'valid') {
          setUploadStatus('valid');
        } else {
          setUploadStatus('invalid');
          setErrors(response.data.errors || []);
        }
      } catch (err: any) {
        if (err.response?.data?.errors) {
          setUploadStatus('invalid');
          setErrors(err.response.data.errors);
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="grid-2 full">
      <div className="card">
        <div className="card-title">Upload Files</div>

        <div className="form-group">
          <label>Select Template</label>
          <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
            <option value="">-- Choose template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Folder Name (Optional)</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g., Sales_2024_Jan"
          />
          <small>Files will be organized in this folder</small>
        </div>

        <div className="form-group">
          <label>Excel Files</label>
          <div className="upload-area" onClick={() => document.querySelector('#file-input')?.click()}>
            <div className="upload-icon">📁</div>
            <p>Click to select files</p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
            />
          </div>
          {files.length > 0 && <small>{files.length} file(s) selected</small>}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!files.length || !selectedTemplate || loading}
        >
          {loading ? '⏳' : '📤'} Validate & Upload
        </button>

        {uploadStatus === 'valid' && (
          <div className="alert alert-success" style={{ marginTop: '16px' }}>
            ✅ All files validated successfully!
          </div>
        )}

        {uploadStatus === 'invalid' && errors.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div className="alert alert-error">
              ❌ Found {errors.length} validation error(s)
            </div>

            <table className="error-table">
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Column</th>
                  <th>Value</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {errors.slice(0, 20).map((err, idx) => (
                  <tr key={idx}>
                    <td>{err.row}</td>
                    <td>{err.column}</td>
                    <td style={{ fontSize: '11px' }}>{String(err.value).substring(0, 20)}</td>
                    <td>{err.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {errors.length > 20 && (
              <small style={{ display: 'block', marginTop: '8px', color: '#999' }}>
                Showing first 20 of {errors.length} errors
              </small>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
