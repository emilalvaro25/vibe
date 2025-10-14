/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const suggestions = [
  'Landing page',
  'Todo app',
  'Dashboard',
  'Blog',
  'E-commerce',
  'Portfolio',
  'Login form with a sleek design',
  'A weather card component'
];

export default function Intro({ onSuggestionClick }) {
  return (
    <div className="intro-view">
      <h1>What can we build together?</h1>
      <div className="suggestion-chips">
        {suggestions.map((text) => (
          <button
            key={text}
            className="suggestion-chip"
            onClick={() => onSuggestionClick(text)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
