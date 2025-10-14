/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import ModelOutput from './ModelOutput';

export default function FeedItem({ userPrompt, modelResponse, isGenerating }) {
  return (
    <div className="chat-turn">
      <div className="user-prompt">{userPrompt}</div>
      {isGenerating && !modelResponse && (
        <div className="loading-indicator">
          <span className="icon">hourglass_top</span> Generating...
        </div>
      )}
      {modelResponse && <ModelOutput code={modelResponse} />}
    </div>
  );
}
