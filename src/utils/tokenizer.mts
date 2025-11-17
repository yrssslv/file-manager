import type { TokenType, Token } from '../types/index.mjs';

export type { TokenType, Token };

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escapeNext = false;
  let wasQuoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);

    if (escapeNext) {
      current += ch;
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (inQuotes) {
      if (ch === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        wasQuoted = true;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuotes = true;
        quoteChar = ch;
      } else if (/\s/.test(ch)) {
        if (current || wasQuoted) {
          tokens.push(parseToken(current, wasQuoted));
          current = '';
          wasQuoted = false;
        }
      } else {
        current += ch;
      }
    }
  }

  if (current || wasQuoted) {
    tokens.push(parseToken(current, inQuotes || wasQuoted));
  }

  return tokens;
}

function parseToken(value: string, quoted: boolean): Token {
  if (value.startsWith('--')) {
    const eqIndex = value.indexOf('=');
    if (eqIndex !== -1) {
      const key = value.slice(2, eqIndex);
      const val = value.slice(eqIndex + 1);
      return { type: 'option', value, quoted, key, val };
    } else {
      return { type: 'flag', value, quoted };
    }
  } else if (value.startsWith('-') && value.length > 1 && !quoted) {
    return { type: 'flag', value, quoted };
  } else {
    return { type: 'argument', value, quoted };
  }
}
