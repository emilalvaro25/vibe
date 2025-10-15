/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export default function FeedItem({ message }) {
  if (message.role === 'user') {
    return (
      <div className="chat-turn">
        <div className="user-prompt">
          {message.image && <img src={message.image} alt="User upload" className="user-prompt-image" />}
          {message.content && <div>{message.content}</div>}
        </div>
      </div>
    );
  }

  if (message.role === 'model') {
    return (
      <div className="chat-turn">
        <div className="model-response-placeholder">
          <span className="icon">spark</span>
          <span>Project generated. See files on the right.</span>
        </div>
      </div>
    )
  }

  return null;
}