/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useEffect } from 'react';
import { createAndDownloadZip } from '../lib/zipUtils';
import Terminal from './Terminal';

const Loader = () => (
    <div className="loader-container">
        <div className="agent-loader">
            <div className="agent-loader-text">
                <span className="icon">spark</span> Generating with 10 agents...
            </div>
            <div className="agent-loader-dots">
                {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="agent-dot" style={{ animationDelay: `${i * 0.15}s` }}></div>
                ))}
            </div>
        </div>
    </div>
);

const parseCodeToFiles = (code) => {
    if (!code || !code.trim()) return [];
    
    const files = [];
    const fileRegex = /(?:<!--|--|#)\s*file:\s*([\w./-]+)\s*(?:-->)?/gi;
    const matches = [...code.matchAll(fileRegex)];

    if (matches.length === 0) {
        if (code.trim()) {
            files.push({ path: 'index.html', content: code.trim() });
        }
        return files;
    }

    if (matches[0].index > 0) {
        const content = code.substring(0, matches[0].index).trim();
        if (content) {
            files.push({ path: 'untitled', content });
        }
    }

    for (let i = 0; i < matches.length; i++) {
        const match = matches[i];
        const path = match[1];
        
        const contentStartIndex = match.index + match[0].length;
        const contentEndIndex = (i + 1 < matches.length) ? matches[i + 1].index : code.length;
        
        const content = code.substring(contentStartIndex, contentEndIndex).trim();

        if (path && content) {
            files.push({ path, content });
        }
    }

    return files;
};


export default function LivePreviewPanel({ code, isGenerating }) {
    const [activeTab, setActiveTab] = useState('preview');
    const [activeFilePath, setActiveFilePath] = useState('');
    const [editedFiles, setEditedFiles] = useState({}); // { [path]: editedContent }

    const files = useMemo(() => parseCodeToFiles(code), [code]);
    const previewFile = useMemo(() => files.find(f => f.path.endsWith('index.html')), [files]);
    
    useEffect(() => {
        setEditedFiles({});
        if (files.length > 0) {
            const readme = files.find(f => f.path.toLowerCase().includes('readme.md'));
            const page = files.find(f => f.path.toLowerCase().includes('app/page.tsx'));
            setActiveFilePath(readme?.path || page?.path || files[0].path);
        } else {
            setActiveFilePath('');
        }
    }, [files]);
    
    const handleCodeChange = (e) => {
        setEditedFiles(prev => ({
            ...prev,
            [activeFilePath]: e.target.value
        }));
    };

    const handleDownload = () => {
        const finalFiles = files.map(file => ({
            path: file.path,
            content: editedFiles[file.path] ?? file.content,
        }));
        createAndDownloadZip(finalFiles);
    };

    if (isGenerating && !code) {
        return <div className="preview-panel-container"><Loader /></div>;
    }

    const activeFileContent = files.find(f => f.path === activeFilePath)?.content ?? '';

    return (
        <div className="preview-panel-container">
            <div className="preview-header">
                <div className="preview-tabs">
                    <button className={`preview-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>
                        <span className="icon">visibility</span> Preview
                    </button>
                    <button className={`preview-tab ${activeTab === 'code' ? 'active' : ''}`} onClick={() => setActiveTab('code')}>
                        <span className="icon">code</span> Code
                    </button>
                    <button className={`preview-tab ${activeTab === 'terminal' ? 'active' : ''}`} onClick={() => setActiveTab('terminal')}>
                        <span className="icon">terminal</span> Terminal
                    </button>
                </div>
                <div className="preview-actions">
                    <button className="download-button" onClick={handleDownload} disabled={files.length === 0}>
                        <span className="icon">download</span> Download .zip
                    </button>
                </div>
            </div>

            {activeTab === 'preview' && (
                <div className="preview-content">
                    {previewFile ? (
                        <iframe
                            srcDoc={previewFile.content}
                            sandbox="allow-scripts allow-same-origin"
                            title="UI Preview"
                            loading="lazy"
                            style={{width: '100%', height: '100%', border: 'none', backgroundColor: 'white'}}
                        />
                    ) : (
                        <div className="loader-container">
                            <p style={{color: 'var(--muted)'}}>No preview available (index.html not found).</p>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'code' && (
                <div className="preview-content">
                    <div className="file-explorer">
                        <ul>
                            {files.map(file => (
                                <li key={file.path}>
                                    <button
                                        className={activeFilePath === file.path ? 'active' : ''}
                                        onClick={() => setActiveFilePath(file.path)}
                                        title={file.path}
                                    >
                                        {file.path}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="code-editor-pane">
                        {isGenerating && files.length === 0 ? (
                            <Loader />
                        ) : activeFilePath ? (
                            <textarea
                                className="code-editor"
                                value={editedFiles[activeFilePath] ?? activeFileContent}
                                onChange={handleCodeChange}
                                readOnly={isGenerating}
                                spellCheck="false"
                            />
                        ) : (
                            <div className="loader-container">
                                <p>No files generated.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'terminal' && (
                <div className="preview-content">
                    <Terminal files={files} />
                </div>
            )}

        </div>
    );
}