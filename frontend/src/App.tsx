import React, { useState } from 'react';
import './index.css';
import TemplateBuilder from './pages/TemplateBuilder';
import UploadForm from './pages/UploadForm';

type Tab = 'build' | 'upload';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('build');

  return (
    <div>
      <div className="header">
        <div className="container">
          <h1>📊 Excel Template Validator</h1>
          <p>Create templates and validate your Excel files with ease</p>
        </div>
      </div>

      <div className="container">
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'build' ? 'active' : ''}`}
            onClick={() => setActiveTab('build')}
          >
            ✏️ Create Template
          </button>
          <button
            className={`nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            📤 Upload & Validate
          </button>
        </div>

        {activeTab === 'build' && <TemplateBuilder />}
        {activeTab === 'upload' && <UploadForm />}
      </div>
    </div>
  );
}

export default App;
