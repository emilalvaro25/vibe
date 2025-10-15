/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useRef, useEffect } from 'react';

export default function ModelOutput({ code }) {
  const iframeRef = useRef(null);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer;

    const resizeIframe = () => {
      if (!iframe.contentWindow?.document?.body) return;
      try {
        const body = iframe.contentWindow.document.body;
        const html = iframe.contentWindow.document.documentElement;
        const contentHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
        // Prevent feedback loop of observation and resizing
        if (Math.abs(iframe.offsetHeight - contentHeight) > 1) {
            iframe.style.height = `${contentHeight}px`;
        }
      } catch (error) {
        // This can happen due to same-origin policy if the iframe's content navigates
        console.warn('Iframe resize failed, possibly due to cross-origin restrictions.', error);
      }
    };

    const handleLoad = () => {
      resizeIframe();
      if (iframe.contentWindow?.document?.body) {
        try {
          observer = new ResizeObserver(resizeIframe);
          observer.observe(iframe.contentWindow.document.body);
        } catch (error) {
          console.warn('Could not observe iframe content.', error);
        }
      }
    };

    iframe.addEventListener('load', handleLoad);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [code]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  const openInNewTab = () => {
    try {
      const blob = new Blob([code], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open in new tab: ', err);
    }
  };

  return (
    <div className="model-output">
      <div className="model-output-header">
        <span className="header-title">Preview</span>
        <div className="header-actions">
          <button onClick={copyToClipboard} className="header-action-button" aria-label="Copy HTML">
            <span className="icon">content_copy</span>
          </button>
          <button onClick={openInNewTab} className="header-action-button" aria-label="Open in new tab">
            <span className="icon">open_in_new</span>
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        srcDoc={code || ''}
        sandbox="allow-scripts allow-same-origin"
        title="UI Preview"
        loading="lazy"
      />
    </div>
  );
}