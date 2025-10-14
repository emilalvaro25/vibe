/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback, useRef, useEffect } from 'react';
import useStore from '../lib/store';
import { startChat, continueChat } from '../lib/actions';
import Intro from './Intro';
import FeedItem from './FeedItem';

export default function App() {
  const messages = useStore((state) => state.messages);
  const isGenerating = useStore((state) => state.isGenerating);
  const chat = useStore((state) => state.chat);
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState(null); // { name: string, data: base64 string }
  const [isRecording, setIsRecording] = useState(false);
  const [theme, setTheme] = useState('dark');

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

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
  
  return (
    <div className="app-container">
      <header>
        <div className="header-left">
          <div className="header-logo">Emilio Vcoder</div>
          <button className="header-button">
            Select chat <span className="icon">expand_more</span>
          </button>
        </div>
        <div className="header-right">
          <button className="header-button">What's This?</button>
          <a href="https://github.com/vercel/v0" target="_blank" rel="noopener noreferrer" className="header-link">
            <span className="icon">code</span> GitHub
          </a>
          <button className="header-button deploy-button">Deploy</button>
          <button onClick={toggleTheme} className="header-button theme-toggle-button" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              <span className="icon">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          <div className="avatar">EV</div>
        </div>
      </header>

      <main>
        {messages.length === 0 ? (
          <Intro onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="chat-feed">
            {messages.map((msg, index) => {
              if (msg.role === 'user') {
                const modelMessage = messages[index + 1];
                if (modelMessage) {
                  return (
                    <FeedItem 
                      key={msg.id} 
                      userPrompt={msg.content}
                      userImage={msg.image}
                      modelResponse={modelMessage.content} 
                      isGenerating={isGenerating && index === messages.length - 2}
                    />
                  );
                }
              }
              return null;
            })}
          </div>
        )}
      </main>

      <footer className="prompt-footer">
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
              disabled={(!prompt.trim() && !image) || isGenerating}
              aria-label="Submit prompt"
            >
              <span className="icon">arrow_upward</span>
            </button>
          </div>
        </div>
        <p className="footer-text">Powered By Aquilles</p>
      </footer>
    </div>
  );
}