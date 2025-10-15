/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
const suggestions = [
  'Landing page for a SaaS product',
  'Todo app with local storage',
  'Dashboard with charts',
  'A weather card component',
  'Simple Flask app',
  'Portfolio website',
  'Login form with a sleek design',
  'Python script for data analysis'
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