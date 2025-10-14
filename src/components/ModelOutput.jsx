/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useRef, useEffect } from 'react';

export default function ModelOutput({ code }) {
  const iframeRef = useRef(null);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const handleLoad = () => {
        const body = iframe.contentWindow.document.body;
        const html = iframe.contentWindow.document.documentElement;
        // Set height based on content
        const height = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
        iframe.style.height = height + 'px';
      };
      
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [code]); // Rerun when code changes

  return (
    <div className="model-output">
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
