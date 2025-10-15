// Conservative fixups for generated code blocks.
export function autofixContent(raw) {
  try {
    if (typeof raw !== 'string' || !raw.trim()) return raw;
    let out = raw;
    out = out.replace(/```(html)?\n([\s\S]*?)```/gi, (_, __, body) => {
      const wrapped = ensureHtmlSkeleton(sanitizeInlineScripts(body.trim()));
      return "```html\n" + wrapped + "\n```";
    });
    out = out.replace(/```(jsx|tsx)\n([\s\S]*?)```/gi, (_, lang, body) => {
      const fixed = ensureReactExport(body);
      return "```" + lang + "\n" + fixed + "\n```";
    });
    out = out.replace(/```css\n([\s\S]*?)```/gi, (m, body) => {
      const fixed = body.replace(/@charset[^;]+;/gi, '').trim();
      return "```css\n" + fixed + "\n```";
    });
    return out;
  } catch { return raw; }
}
function sanitizeInlineScripts(s) {
  return s.replace(/on[a-z]+\s*=\s*(['"]).*?\1/gi, '');
}
function ensureHtmlSkeleton(s) {
  const hasHtml = /<html[\s\S]*<\/html>/i.test(s);
  const hasBody = /<body[\s\S]*<\/body>/i.test(s);
  if (hasHtml && hasBody) return s;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Preview</title>
  <style>html,body{margin:0;padding:0;}</style>
</head>
<body>
${s}
</body>
</html>`;
}
function ensureReactExport(src) {
  if (/export\s+default\s+/m.test(src)) return src;
  if (/function\s+App\s*\(/.test(src)) return src + "\nexport default App;";
  const m = src.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*\(/);
  if (m) return src + `\nexport default ${m[1]};`;
  if (/<[A-Za-z]/.test(src)) {
    return `import React from 'react';\nfunction App(){\n  return (\n${src}\n  );\n}\nexport default App;`;
  }
  return src;
}
