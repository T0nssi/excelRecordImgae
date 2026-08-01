import React, { useState } from 'react';
import './styles/minimal.css';
import TemplateBuilderV2 from './pages/TemplateBuilderV2';
import FileUploaderV2 from './pages/FileUploaderV2';
import FileManagerV2 from './pages/FileManagerV2';

type Page = 'build' | 'upload' | 'manage';

export default function AppV2() {
  const [currentPage, setCurrentPage] = useState<Page>('build');

  const renderPage = () => {
    switch (currentPage) {
      case 'build':
        return <TemplateBuilderV2 />;
      case 'upload':
        return <FileUploaderV2 />;
      case 'manage':
        return <FileManagerV2 />;
      default:
        return <TemplateBuilderV2 />;
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <h2>📊 Excel</h2>
        <nav>
          <div
            className={`nav-item ${currentPage === 'build' ? 'active' : ''}`}
            onClick={() => setCurrentPage('build')}
          >
            ✏️ Build Template
          </div>
          <div
            className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
            onClick={() => setCurrentPage('upload')}
          >
            📤 Upload File
          </div>
          <div
            className={`nav-item ${currentPage === 'manage' ? 'active' : ''}`}
            onClick={() => setCurrentPage('manage')}
          >
            📁 File Manager
          </div>
        </nav>
      </div>

      <div className="main">
        <div className="header">
          <h1>
            {currentPage === 'build' && 'Create Template'}
            {currentPage === 'upload' && 'Upload & Validate'}
            {currentPage === 'manage' && 'File Manager'}
          </h1>
        </div>

        <div className="content">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
