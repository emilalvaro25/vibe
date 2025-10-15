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

// New, more robust parser
const parseCodeToFiles = (code) => {
    if (!code || !code.trim()) return [];

    const files = [];
    const fileRegex = /(?:<!--|--|#)\s*file:\s*([\w./-]+)\s*(?:-->)?\s*\n?/gi;
    let lastIndex = 0;
    let match;

    while ((match = fileRegex.exec(code)) !== null) {
        if (lastIndex < match.index) {
             // Capture content without a file marker at the beginning
            const content = code.substring(lastIndex, match.index).trim();
            if (content) files.push({ path: 'untitled', content });
        }
        
        const path = match[1];
        const contentStartIndex = match.index + match[0].length;
        
        // Find the start of the next file marker
        const nextMatch = fileRegex.exec(code);
        fileRegex.lastIndex = contentStartIndex; // Reset search position

        const contentEndIndex = nextMatch ? nextMatch.index : code.length;
        const content = code.substring(contentStartIndex, contentEndIndex).trim();

        if (path && content) {
            files.push({ path, content });
        }
        
        lastIndex = contentEndIndex;
        if (nextMatch) fileRegex.lastIndex = nextMatch.index;
        else break;
    }

    if (files.length === 0 && code.trim()) {
        files.push({ path: 'index.html', content: code });
    }
    
    return files;
};


export default function LivePreviewPanel({ code, isGenerating }) {
    const [activeTab, setActiveTab] = useState('code');
    const [activeFilePath, setActiveFilePath] = useState('');
    const [editedFiles, setEditedFiles] = useState({}); // { [path]: editedContent }

    const files = useMemo(() => parseCodeToFiles(code), [code]);
    
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