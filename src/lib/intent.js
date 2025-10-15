export function detectIntent(prompt) {
  const p = (prompt || '').toLowerCase();
  const logoHints = /\b(logo|logomark|wordmark|brand mark|app icon|favicon)\b/;
  if (logoHints.test(p)) return 'logo';
  const imageHints = /(image|illustration|banner|icon|hero|mockup|wallpaper|photo|background|thumbnail)/;
  const codeHints  = /(build|implement|create|make|scaffold|component|react|html|css|api|endpoint|function|class|hook|typescript|tailwind|vite|node|express|next\.js|ui|layout|form|table|chart)/;
  if (imageHints.test(p)) return 'image';
  if (codeHints.test(p)) return 'coder';
  return 'general';
}
