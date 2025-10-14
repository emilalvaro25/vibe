/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import ModelOutput from './ModelOutput';

export default function FeedItem({ userPrompt, userImage, modelResponse, isGenerating }) {
  return (
    <div className="chat-turn">
      <div className="user-prompt">
        {userImage && <img src={userImage} alt="User upload" className="user-prompt-image" />}
        {userPrompt && <div>{userPrompt}</div>}
      </div>
      {isGenerating && !modelResponse && (
        <div className="loading-indicator">
          <span className="icon">hourglass_top</span> Generating...
        </div>
      )}
      {modelResponse && <ModelOutput code={modelResponse} />}
    </div>
  );
}