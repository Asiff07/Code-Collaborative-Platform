import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

const FileExplorer = forwardRef(({ files, activeFile, onSelectFile, onCreateFile, onRenameFile, onDeleteFile }, ref) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(null); // stores old filename
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    triggerNewFile: () => {
      startCreate();
    }
  }));

  useEffect(() => {
    if ((isCreating || isRenaming) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, isRenaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const name = inputValue.trim();
    if (!name) {
      handleCancel();
      return;
    }

    const validExtensions = ['.html', '.css', '.js'];
    if (!validExtensions.some(ext => name.endsWith(ext))) {
      alert("Invalid extension! Only .html, .css, and .js are allowed.");
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    if (isCreating) {
      if (files[name]) {
        alert("File already exists!");
        return;
      }
      onCreateFile(name);
    } else if (isRenaming) {
      if (files[name] && name !== isRenaming) {
        alert("File already exists!");
        return;
      }
      onRenameFile(isRenaming, name);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsRenaming(null);
    setInputValue("");
  };

  const startCreate = () => {
    setIsCreating(true);
    setIsRenaming(null);
    setInputValue("");
  };

  const startRename = (filename, e) => {
    e.stopPropagation();
    setIsRenaming(filename);
    setIsCreating(false);
    setInputValue(filename);
  };

  const handleDelete = (filename, e) => {
    e.stopPropagation();
    if (Object.keys(files).length <= 1) {
      alert("Cannot delete the last file. Restoring defaults or keeping at least one is required.");
      return;
    }
    onDeleteFile(filename);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] select-none h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Explorer</span>
        <button 
          onClick={startCreate} 
          className="text-slate-300 hover:text-white bg-white/5 hover:bg-white/20 p-1 rounded transition-all flex items-center justify-center shadow-sm" 
          title="New File (Ctrl+N)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {Object.keys(files).map((filename) => (
          <div key={filename} className="relative group">
            {isRenaming === filename ? (
              <form onSubmit={handleSubmit} className="px-4 py-1.5 flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleCancel}
                  onKeyDown={e => { if (e.key === 'Escape') handleCancel(); }}
                  className="w-full bg-[#1e1e24] text-white text-sm px-2 py-1 outline-none border border-indigo-500 rounded"
                />
              </form>
            ) : (
              <button
                onClick={() => onSelectFile(filename)}
                className={`w-full text-left px-4 py-2 text-sm transition-all flex items-center justify-between group ${
                  activeFile === filename 
                    ? "bg-indigo-500/20 text-indigo-300 border-l-2 border-indigo-500" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {filename.endsWith('.html') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-orange-400 flex-shrink-0" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>}
                  {filename.endsWith('.css') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-blue-400 flex-shrink-0" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>}
                  {filename.endsWith('.js') && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-yellow-400 flex-shrink-0" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>}
                  <span className="truncate">{filename}</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span onClick={(e) => startRename(filename, e)} className="p-1 hover:text-indigo-400 hover:bg-indigo-500/20 rounded cursor-pointer transition-colors" title="Rename">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </span>
                  <span onClick={(e) => handleDelete(filename, e)} className="p-1 hover:text-red-400 hover:bg-red-500/20 rounded cursor-pointer transition-colors" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </span>
                </div>
              </button>
            )}
          </div>
        ))}
        
        {isCreating && (
          <form onSubmit={handleSubmit} className="px-4 py-1.5 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleCancel}
              onKeyDown={e => { if (e.key === 'Escape') handleCancel(); }}
              placeholder="e.g. style.css"
              className="w-full bg-[#1e1e24] text-white text-sm px-2 py-1 outline-none border border-indigo-500 rounded"
            />
          </form>
        )}
      </div>
    </div>
  );
});

export default FileExplorer;
