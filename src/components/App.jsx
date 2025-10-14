/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useCallback } from 'react';
import useStore from '../lib/store';
import { startChat, continueChat, resetChat } from '../lib/actions';
import Intro from './Intro';
import FeedItem from './FeedItem';

export default function App() {
  const { messages, isGenerating, chat } = useStore.getState();
  const [prompt, setPrompt] = useState('');

  const handlePromptSubmit = useCallback(async () => {
    if (prompt.trim() && !isGenerating) {
      if (chat) {
        await continueChat(prompt);
      } else {
        await startChat(prompt);
      }
      setPrompt('');
    }
  }, [prompt, isGenerating, chat]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setPrompt(suggestion);
  }, []);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handlePromptSubmit();
    }
  }, [handlePromptSubmit]);

  return (
    <div className="app-container">
      <header>
        <div className="header-left">
          <div className="header-logo">Generative UI</div>
          <button className="header-button">
            Select chat <span className="icon">expand_more</span>
          </button>
        </div>
        <div className="header-right">
          <button className="header-button">What's This?</button>
          <a href="https://github.com/google-gemini/generative-ai-docs/tree/main/demos/VibeCheck" target="_blank" rel="noopener noreferrer" className="header-link">
            <span className="icon">code</span> GitHub
          </a>
          <button className="header-button deploy-button">Deploy</button>
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
                if (modelMessage && modelMessage.role === 'model') {
                  return (
                    <FeedItem 
                      key={msg.id} 
                      userPrompt={msg.content} 
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
        <div className="prompt-input-wrapper">
          <div className="prompt-input-icons left">
            <button className="prompt-icon-button"><span className="icon">add</span></button>
          </div>
          <input
            className="prompt-input"
            placeholder="Describe what you want to build..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
          />
          <div className="prompt-input-icons right">
            <button className="prompt-icon-button"><span className="icon">mic</span></button>
            <button 
              className="prompt-icon-button prompt-submit-button" 
              onClick={handlePromptSubmit}
              disabled={!prompt.trim() || isGenerating}
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