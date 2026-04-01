import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FileExplorer from './FileExplorer';
import CodeEditor from './CodeEditor';
import LivePreview from './LivePreview';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DEFAULT_FILES = {
  "index.html": { content: "<!DOCTYPE html>\n<html>\n<head>\n  <link rel=\"stylesheet\" href=\"style.css\" />\n</head>\n<body>\n  <div class=\"container\">\n    <h1>Welcome to DevSync Pro Playground</h1>\n    <p>Realistic DOM parsing & execution order.</p>\n  </div>\n\n  <script src=\"script.js\"></script>\n</body>\n</html>", language: "html" },
  "style.css": { content: "body {\n  font-family: 'Inter', sans-serif;\n  background: #1e1e24;\n  color: #fff;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n\n.container {\n  text-align: center;\n  background: rgba(255,255,255,0.05);\n  padding: 40px;\n  border-radius: 12px;\n  border: 1px solid rgba(255,255,255,0.1);\n}\n\nh1 {\n  color: #a855f7;\n  margin-bottom: 10px;\n}", language: "css" },
  "script.js": { content: "console.log('Playground Initialized!');\n\nsetTimeout(() => {\n  console.info('Scripts load securely and reliably.');\n}, 1000);", language: "javascript" }
};

export default function MultiFileEditor() {
  const navigate = useNavigate();
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('devsync_playground_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) return parsed;
      }
    } catch (e) {
      console.error("Local storage read failed", e);
    }
    return DEFAULT_FILES;
  });
  
  const [activeFile, setActiveFile] = useState(() => {
    const keys = Object.keys(files);
    return keys.includes("index.html") ? "index.html" : keys[0];
  });

  const [entryFile, setEntryFile] = useState(() => {
    const keys = Object.keys(files);
    return keys.includes("index.html") ? "index.html" : (keys.find(k => k.endsWith('.html')) || "");
  });
  
  const [isAutoPreview, setIsAutoPreview] = useState(true);
  const [forceRender, setForceRender] = useState(0);
  const [editorErrors, setEditorErrors] = useState([]);
  
  const saveTimeoutRef = useRef(null);
  const explorerRef = useRef(null);

  // Auto-save with Debounce
  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem('devsync_playground_files', JSON.stringify(files));
      } catch(e) {
        console.warn("Storage quota exceeded or unavailable");
      }
    }, 500);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [files]);

  const handleCodeChange = (filename, newContent) => {
    setFiles(prev => ({
      ...prev,
      [filename]: {
        ...prev[filename],
        content: newContent
      }
    }));
  };

  const getLanguage = (filename) => {
    const ext = filename.split('.').pop();
    if (ext === "html") return "html";
    if (ext === "css") return "css";
    return "javascript";
  };

  const handleCreateFile = (filename) => {
    setFiles(prev => ({
      ...prev,
      [filename]: { content: "", language: getLanguage(filename) }
    }));
    setActiveFile(filename);
    
    // Auto-set entry if it's the first HTML file
    if (filename.endsWith('.html') && !entryFile) {
      setEntryFile(filename);
    }
  };

  const handleRenameFile = (oldName, newName) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      newFiles[newName] = { ...newFiles[oldName], language: getLanguage(newName) };
      delete newFiles[oldName];
      return newFiles;
    });
    if (activeFile === oldName) setActiveFile(newName);
    if (entryFile === oldName && newName.endsWith('.html')) setEntryFile(newName);
  };

  const handleDeleteFile = (filename) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[filename];
      
      if (Object.keys(newFiles).length === 0) {
        setEntryFile("index.html");
        return DEFAULT_FILES;
      }
      return newFiles;
    });

    if (activeFile === filename) {
      const remainingFiles = Object.keys(files).filter(f => f !== filename);
      setActiveFile(remainingFiles.length > 0 ? remainingFiles[0] : "");
    }

    if (entryFile === filename) {
      const remainingHtml = Object.keys(files).find(f => f !== filename && f.endsWith('.html'));
      setEntryFile(remainingHtml || "");
    }
  };

  const handleExportTemplate = async () => {
    try {
      const zip = new JSZip();
      Object.keys(files).forEach(filename => {
        zip.file(filename, files[filename].content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, 'devsync-project.zip');
    } catch (e) {
      console.error("Export failed:", e);
      alert("Failed to export project.");
    }
  };

  const triggerRun = () => setForceRender(f => f + 1);
  const triggerNew = () => explorerRef.current?.triggerNewFile();
  const triggerDelete = () => {
    if (Object.keys(files).length > 1) {
      handleDeleteFile(activeFile);
    }
  };

  const handleBack = () => {
    // If opened in new tab, history length is typically 1 or 2. We route home safely.
    if (window.history.length > 2) navigate(-1);
    else navigate('/');
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerRun();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        triggerNew();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        triggerDelete();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [activeFile, files]);

  return (
    <div className="flex w-full h-screen bg-[#050508] text-white overflow-hidden font-sans select-none">
      <div className="w-1/5 border-r border-white/10 flex flex-col bg-[#0a0a0f] min-w-[200px] h-full overflow-hidden">
        <FileExplorer 
          ref={explorerRef}
          files={files} 
          activeFile={activeFile} 
          entryFile={entryFile}
          onSelectFile={setActiveFile} 
          onCreateFile={handleCreateFile}
          onRenameFile={handleRenameFile}
          onDeleteFile={handleDeleteFile}
          onSetEntryFile={setEntryFile}
          onExport={handleExportTemplate}
          onBack={handleBack}
        />
      </div>
      <div className="w-2/5 border-r border-white/10 flex flex-col relative h-full min-w-0 overflow-hidden select-auto">
        <CodeEditor 
          file={files[activeFile]} 
          filename={activeFile}
          onChange={handleCodeChange}
          onSaveShortcut={triggerRun}
          onNewShortcut={triggerNew}
          onDeleteShortcut={triggerDelete}
          editorErrors={editorErrors}
        />
      </div>
      <div className="w-2/5 flex flex-col bg-[#1e1e24] min-w-0 h-full overflow-hidden select-auto">
        <LivePreview 
          files={files}
          entryFile={entryFile}
          isAuto={isAutoPreview}
          forceRender={forceRender}
          onToggleAuto={() => setIsAutoPreview(!isAutoPreview)}
          onRunManual={triggerRun}
          onErrorsChange={setEditorErrors}
        />
      </div>
    </div>
  );
}
