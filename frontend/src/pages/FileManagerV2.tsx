import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Upload {
  id: string;
  filename: string;
  status: string;
  uploaded_at: string;
  version: number;
}

interface FileHistory {
  version_number: number;
  action: string;
  changes_description: string;
  edited_at: string;
}

const API_BASE = 'http://localhost:3001/api';

export default function FileManagerV2() {
  const [files, setFiles] = useState<Upload[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<Upload[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<Upload | null>(null);
  const [history, setHistory] = useState<FileHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch files (mock data for now)
    const mockFiles: Upload[] = [
      {
        id: '1',
        filename: 'sales_report_jan.xlsx',
        status: 'valid',
        uploaded_at: '2024-01-15 10:30',
        version: 3
      },
      {
        id: '2',
        filename: 'inventory_2024.xlsx',
        status: 'valid',
        uploaded_at: '2024-01-14 14:22',
        version: 1
      },
      {
        id: '3',
        filename: 'customer_data.xlsx',
        status: 'invalid',
        uploaded_at: '2024-01-13 09:15',
        version: 2
      }
    ];
    setFiles(mockFiles);
    setFilteredFiles(mockFiles);
  }, []);

  useEffect(() => {
    const filtered = files.filter(f =>
      f.filename.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredFiles(filtered);
  }, [search, files]);

  const handleSelectFile = async (file: Upload) => {
    setSelectedFile(file);
    // Mock history data
    const mockHistory: FileHistory[] = [
      {
        version_number: 3,
        action: 'edit',
        changes_description: 'Updated sales figures',
        edited_at: '2024-01-15 10:30'
      },
      {
        version_number: 2,
        action: 'clone',
        changes_description: 'Cloned from sales_report_dec.xlsx',
        edited_at: '2024-01-10 15:00'
      },
      {
        version_number: 1,
        action: 'upload',
        changes_description: 'Initial upload',
        edited_at: '2024-01-05 08:00'
      }
    ];
    setHistory(mockHistory);
  };

  const handleClone = async () => {
    if (!selectedFile) return;
    setLoading(true);
    try {
      // Mock clone
      const newFile: Upload = {
        ...selectedFile,
        id: Math.random().toString(),
        filename: `${selectedFile.filename.split('.')[0]}_copy.xlsx`,
        version: 1,
        uploaded_at: new Date().toLocaleString()
      };
      setFiles([newFile, ...files]);
      setSelectedFile(newFile);
    } catch (err) {
      console.error('Clone failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFile) return;
    try {
      window.location.href = `${API_BASE}/uploads/${selectedFile.id}/download`;
    } catch (err) {
      console.error('Download failed');
    }
  };

  return (
    <div className="grid-2">
      {/* File List */}
      <div className="card">
        <div className="card-title">Files</div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="file-list">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`file-item ${selectedFile?.id === file.id ? 'selected' : ''}`}
              onClick={() => handleSelectFile(file)}
            >
              <div>
                <div className="file-name">📄 {file.filename}</div>
                <div className="file-date">{file.uploaded_at} • v{file.version}</div>
              </div>
              <span className="badge">{file.status}</span>
            </div>
          ))}
        </div>

        {filteredFiles.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
            No files found
          </div>
        )}
      </div>

      {/* Details & History */}
      <div className="card">
        <div className="card-title">
          {selectedFile ? selectedFile.filename : 'Select a file'}
        </div>

        {selectedFile ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', marginBottom: '12px' }}>
                <div><strong>Status:</strong> {selectedFile.status}</div>
                <div><strong>Version:</strong> {selectedFile.version}</div>
                <div><strong>Uploaded:</strong> {selectedFile.uploaded_at}</div>
              </div>

              <div className="btn-group">
                <button className="btn btn-primary" onClick={handleDownload}>
                  📥 Download
                </button>
                <button className="btn btn-secondary" onClick={handleClone} disabled={loading}>
                  🔀 Clone
                </button>
                <button className="btn btn-secondary">
                  ✏️ Edit
                </button>
              </div>
            </div>

            {/* Version History */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
                📋 Version History
              </div>

              <table className="error-table">
                <thead>
                  <tr>
                    <th>Ver</th>
                    <th>Action</th>
                    <th>Changes</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>v{h.version_number}</td>
                      <td>{h.action}</td>
                      <td style={{ fontSize: '12px' }}>{h.changes_description}</td>
                      <td style={{ fontSize: '12px' }}>{h.edited_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
            Select a file to view details
          </div>
        )}
      </div>
    </div>
  );
}
