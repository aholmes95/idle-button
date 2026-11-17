import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');
const OUTPUT_PATH = '/home/antigravity/.gemini/jetski/brain/v1/default/jetski_remote_agents_3p/6f83d6e1-5167-4469-8d04-70816e8086f2/idle_button.html';

const MODULE_ORDER = [
  'js/format.js',
  'js/data.js',
  'js/state.js',
  'js/modifiers.js',
  'js/economy.js',
  'js/audio.js',
  'js/ui.js',
  'js/floors/td.js',
  'js/floors/rpg.js',
  'js/floors/merge.js',
  'js/game.js'
];

/**
 * Character-by-character state-machine stripper for ES module import/export syntax.
 * Preserves string literals, template literals, and comments untouched.
 */
function stripModuleSyntax(code) {
  const len = code.length;
  let out = '';
  let i = 0;
  let state = 'NORMAL'; // NORMAL | SINGLE | DOUBLE | TEMPLATE | LINE_COMMENT | BLOCK_COMMENT
  let atLineStart = true;

  function skipWsAndComments(idx) {
    let j = idx;
    while (j < len) {
      const ch = code[j];
      if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
        j++;
      } else if (ch === '/' && code[j + 1] === '/') {
        j += 2;
        while (j < len && code[j] !== '\n') j++;
      } else if (ch === '/' && code[j + 1] === '*') {
        j += 2;
        while (j < len && !(code[j] === '*' && code[j + 1] === '/')) j++;
        j += 2;
      } else {
        break;
      }
    }
    return j;
  }

  function consumeStatementEnd(idx) {
    let j = idx;
    let st = 'NORMAL';
    let braceDepth = 0;
    while (j < len) {
      const ch = code[j];
      if (st === 'NORMAL') {
        if (ch === "'") st = 'SINGLE';
        else if (ch === '"') st = 'DOUBLE';
        else if (ch === '`') st = 'TEMPLATE';
        else if (ch === '/' && code[j + 1] === '/') { st = 'LINE_COMMENT'; j++; }
        else if (ch === '/' && code[j + 1] === '*') { st = 'BLOCK_COMMENT'; j++; }
        else if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
        else if (ch === ';' && braceDepth === 0) { j++; break; }
        else if (ch === '\n' && braceDepth === 0) {
          // Check if next non-ws token continues the import/export (e.g. `from`)
          const next = skipWsAndComments(j + 1);
          if (!code.startsWith('from', next)) {
            j++;
            break;
          }
        }
      } else if (st === 'SINGLE') {
        if (ch === '\\') j++;
        else if (ch === "'") st = 'NORMAL';
      } else if (st === 'DOUBLE') {
        if (ch === '\\') j++;
        else if (ch === '"') st = 'NORMAL';
      } else if (st === 'TEMPLATE') {
        if (ch === '\\') j++;
        else if (ch === '`') st = 'NORMAL';
      } else if (st === 'LINE_COMMENT') {
        if (ch === '\n') st = 'NORMAL';
      } else if (st === 'BLOCK_COMMENT') {
        if (ch === '*' && code[j + 1] === '/') { st = 'NORMAL'; j++; }
      }
      j++;
    }
    return j;
  }

  while (i < len) {
    const ch = code[i];

    if (state === 'NORMAL') {
      if (ch === "'") {
        state = 'SINGLE';
        out += ch;
        i++;
        atLineStart = false;
        continue;
      }
      if (ch === '"') {
        state = 'DOUBLE';
        out += ch;
        i++;
        atLineStart = false;
        continue;
      }
      if (ch === '`') {
        state = 'TEMPLATE';
        out += ch;
        i++;
        atLineStart = false;
        continue;
      }
      if (ch === '/' && code[i + 1] === '/') {
        state = 'LINE_COMMENT';
        out += '//';
        i += 2;
        continue;
      }
      if (ch === '/' && code[i + 1] === '*') {
        state = 'BLOCK_COMMENT';
        out += '/*';
        i += 2;
        continue;
      }

      if (atLineStart) {
        if (code.startsWith('import', i) && /[\s{'"]/.test(code[i + 6] || '')) {
          i = consumeStatementEnd(i);
          atLineStart = true;
          continue;
        }
        if (code.startsWith('export', i) && /[\s{*]/.test(code[i + 6] || '')) {
          const afterExport = skipWsAndComments(i + 6);
          if (code[afterExport] === '{' || code[afterExport] === '*') {
            i = consumeStatementEnd(i);
            atLineStart = true;
            continue;
          }
          if (code.startsWith('default', afterExport) && /\s/.test(code[afterExport + 7] || '')) {
            i = skipWsAndComments(afterExport + 7);
            atLineStart = false;
            continue;
          }
          i = afterExport;
          atLineStart = false;
          continue;
        }
      }

      out += ch;
      if (ch === '\n') {
        atLineStart = true;
      } else if (ch !== ' ' && ch !== '\t' && ch !== '\r') {
        atLineStart = false;
      }
      i++;
    } else if (state === 'SINGLE') {
      out += ch;
      if (ch === '\\' && i + 1 < len) {
        out += code[i + 1];
        i += 2;
      } else {
        if (ch === "'") state = 'NORMAL';
        i++;
      }
    } else if (state === 'DOUBLE') {
      out += ch;
      if (ch === '\\' && i + 1 < len) {
        out += code[i + 1];
        i += 2;
      } else {
        if (ch === '"') state = 'NORMAL';
        i++;
      }
    } else if (state === 'TEMPLATE') {
      out += ch;
      if (ch === '\\' && i + 1 < len) {
        out += code[i + 1];
        i += 2;
      } else {
        if (ch === '`') state = 'NORMAL';
        i++;
      }
    } else if (state === 'LINE_COMMENT') {
      out += ch;
      if (ch === '\n') {
        state = 'NORMAL';
        atLineStart = true;
      }
      i++;
    } else if (state === 'BLOCK_COMMENT') {
      out += ch;
      if (ch === '*' && code[i + 1] === '/') {
        out += '/';
        state = 'NORMAL';
        i += 2;
      } else {
        i++;
      }
    }
  }

  return out;
}

function build() {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
  const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');

  const chunks = [];
  for (const relPath of MODULE_ORDER) {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (!fs.existsSync(fullPath)) continue;
    const raw = fs.readFileSync(fullPath, 'utf8');
    const stripped = stripModuleSyntax(raw).trim();
    chunks.push(`// === ${relPath} ===\n${stripped}`);
  }

  const safeJs = chunks.join('\n\n').replace(/<\/script>/gi, '<\\/script>');
  const bundledJs = `(() => {\n'use strict';\n\n${safeJs}\n})();`;

  let standaloneHtml = indexHtml.replace(
    /<link\s+rel="stylesheet"\s+href="styles\.css"\s*\/?>/i,
    () => `<style>\n${stylesCss}\n  </style>`
  );

  standaloneHtml = standaloneHtml.replace(
    /<script\s+type="module"\s+src="js\/game\.js"><\/script>/i,
    () => `<script>\n${bundledJs}\n  </script>`
  );

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, standaloneHtml, 'utf8');
  console.log(`Built standalone artifact: ${OUTPUT_PATH} (${standaloneHtml.length} bytes)`);
}

build();
