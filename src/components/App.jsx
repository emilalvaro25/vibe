/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef, useEffect } from 'react';
import useStore from '../lib/store';
import { startChat, continueChat } from '../lib/actions';
import Intro from './Intro';
import FeedItem from './FeedItem';
import LivePreviewPanel from './LivePreviewPanel';

export default function App() {
  const messages = useStore((state) => state.messages);
  const isGenerating = useStore((state) => state.isGenerating);
  const chat = useStore((state) => state.chat);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null); // { name: string, data: base64 string }
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const feedRef = useRef(null);
  const portalRef = useRef(null);
  const isResizing = useRef(false);

  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const savedWidth = localStorage.getItem('panelWidth');
    return savedWidth ? parseFloat(savedWidth) : 50;
  });

  useEffect(() => {
    localStorage.setItem('panelWidth', leftPanelWidth);
  }, [leftPanelWidth]);


  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  // Effect to set initial theme from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Effect to apply theme to body and save to localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };


  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(p => p ? `${p} ${transcript}` : transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
    
    recognitionRef.current = recognition;
  }, []);

  const handlePromptSubmit = useCallback(async () => {
    const currentPrompt = prompt.trim();
    if ((currentPrompt || image) && !isGenerating) {
      if (chat) {
        await continueChat(currentPrompt, image?.data);
      } else {
        await startChat(currentPrompt, image?.data);
      }
      setPrompt('');
      setImage(null);
    }
  }, [prompt, image, isGenerating, chat]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setPrompt(suggestion);
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  }, [handlePromptSubmit]);

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ name: file.name, data: reader.result });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = null; // Reset file input
  };

  const handleMicClick = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    
    const handleMouseMove = (me) => {
      if (!isResizing.current || !portalRef.current) return;
      const portal = portalRef.current;
      const bounds = portal.getBoundingClientRect();
      const newWidth = ((me.clientX - bounds.left) / bounds.width) * 100;
      const clampedWidth = Math.max(20, Math.min(80, newWidth));
      setLeftPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const lastModelMessage = messages.slice().reverse().find(m => m.role === 'model');
  const isLastMessageGenerating = isGenerating && messages.length > 0 && messages[messages.length-1].role === 'model';
  
  return (
    <div className="app-container">
      <div className="background-glitter">
        <div className="stars" id="stars1"></div>
        <div className="stars" id="stars2"></div>
        <div className="stars" id="stars3"></div>
      </div>
      <header>
        <div className="header-left">
          <div className="header-logo">Eburon</div>
        </div>
        <div className="header-right">
          <div className="desktop-nav">
            <button onClick={toggleTheme} className="header-button theme-toggle-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
            </button>
          </div>
          <div className="avatar">
            <span className="icon">person</span>
          </div>
          <button className="hamburger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
            <span className="icon">{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </header>
      
      {isMenuOpen && (
        <nav className={`mobile-nav ${isMenuOpen ? 'is-open' : ''}`}>
          <button onClick={toggleTheme} className="header-button theme-toggle-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
              <span style={{marginLeft: '8px'}}>Toggle Theme</span>
          </button>
        </nav>
      )}

      {messages.length === 0 ? (
        <>
          <main className="landing-main">
            <Intro onSuggestionClick={handleSuggestionClick} />
          </main>
          <div className="landing-footer-wrapper">
             <footer className={`prompt-footer ${isGenerating ? 'is-generating' : ''}`}>
              {image && (
                <div className="image-preview-wrapper">
                  <img src={image.data} alt="Preview" className="image-preview"/>
                  <span className="image-preview-text">{image.name}</span>
                  <button className="remove-image-btn" onClick={() => setImage(null)} aria-label="Remove image">
                    <span className="icon">close</span>
                  </button>
                </div>
              )}
              <div className="prompt-input-wrapper">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <div className="prompt-input-icons left">
                  <button className="prompt-icon-button" onClick={handleAddFileClick} aria-label="Add file"><span className="icon">add</span></button>
                </div>
                <textarea
                  rows="1"
                  className="prompt-input"
                  placeholder="Describe what you want to build..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  style={{height: 'auto', maxHeight: '200px'}}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <div className="prompt-input-icons right">
                  <button className={`prompt-icon-button ${isRecording ? 'is-recording' : ''}`} onClick={handleMicClick} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                    <span className="icon">mic</span>
                  </button>
                  <button 
                    className="prompt-icon-button prompt-submit-button" 
                    onClick={handlePromptSubmit}
                    disabled={!prompt.trim() && !image}
                    aria-label="Submit prompt"
                  >
                    <span className="icon">arrow_upward</span>
                  </button>
                </div>
              </div>
              <p className="footer-text">Powered by Emilio AI</p>
            </footer>
          </div>
        </>
      ) : (
        <div 
          className="coding-portal"
          ref={portalRef}
          style={{ gridTemplateColumns: `${leftPanelWidth}% 5px 1fr` }}
        >
          <div className="chat-panel">
            <main ref={feedRef}>
                <div className="chat-feed">
                  {messages.map((msg) => (
                      <FeedItem 
                        key={msg.id} 
                        message={msg}
                      />
                    ))}
                </div>
            </main>

            <footer className={`prompt-footer ${isGenerating ? 'is-generating' : ''}`}>
              {image && (
                <div className="image-preview-wrapper">
                  <img src={image.data} alt="Preview" className="image-preview"/>
                  <span className="image-preview-text">{image.name}</span>
                  <button className="remove-image-btn" onClick={() => setImage(null)} aria-label="Remove image">
                    <span className="icon">close</span>
                  </button>
                </div>
              )}
              <div className="prompt-input-wrapper">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                <div className="prompt-input-icons left">
                  <button className="prompt-icon-button" onClick={handleAddFileClick} aria-label="Add file"><span className="icon">add</span></button>
                </div>
                <textarea
                  rows="1"
                  className="prompt-input"
                  placeholder="Describe what you want to build..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isGenerating}
                  style={{height: 'auto', maxHeight: '200px'}}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                />
                <div className="prompt-input-icons right">
                  <button className={`prompt-icon-button ${isRecording ? 'is-recording' : ''}`} onClick={handleMicClick} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>
                    <span className="icon">mic</span>
                  </button>
                  <button 
                    className="prompt-icon-button prompt-submit-button" 
                    onClick={handlePromptSubmit}
                    disabled={!prompt.trim() && !image}
                    aria-label="Submit prompt"
                  >
                    <span className="icon">arrow_upward</span>
                  </button>
                </div>
              </div>
              <p className="footer-text">Powered by Emilio AI</p>
            </footer>
          </div>
          <div className="resizer" onMouseDown={handleMouseDown} />
          <div className="preview-panel">
            {lastModelMessage && (
              <LivePreviewPanel
                code={lastModelMessage.content}
                isGenerating={isLastMessageGenerating}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}