import test from 'node:test';
import assert from 'node:assert/strict';

type TokenType = 'argument' | 'flag' | 'option';

type Token = {
  type: TokenType;
  value: string;
  quoted: boolean;
  key?: string;
  val?: string;
};

function tokenize(input: string): Token[] {
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

test('tokenize basic arguments', () => {
  const result = tokenize('ls -l file.txt');
  assert.deepEqual(result, [
    { type: 'argument', value: 'ls', quoted: false },
    { type: 'flag', value: '-l', quoted: false },
    { type: 'argument', value: 'file.txt', quoted: false },
  ]);
});

test('tokenize with quotes', () => {
  const result = tokenize('echo "hello world"');
  assert.deepEqual(result, [
    { type: 'argument', value: 'echo', quoted: false },
    { type: 'argument', value: 'hello world', quoted: true },
  ]);
});

test('tokenize with escaped characters', () => {
  const result = tokenize('echo "hello\\"world"');
  assert.deepEqual(result, [
    { type: 'argument', value: 'echo', quoted: false },
    { type: 'argument', value: 'hello"world', quoted: true },
  ]);
});

test('tokenize options', () => {
  const result = tokenize('cmd --verbose --output=file.txt');
  assert.deepEqual(result, [
    { type: 'argument', value: 'cmd', quoted: false },
    { type: 'flag', value: '--verbose', quoted: false },
    {
      type: 'option',
      value: '--output=file.txt',
      quoted: false,
      key: 'output',
      val: 'file.txt',
    },
  ]);
});

test('tokenize empty input', () => {
  const result = tokenize('');
  assert.deepEqual(result, []);
});

test('tokenize only spaces', () => {
  const result = tokenize('   ');
  assert.deepEqual(result, []);
});

test('tokenize mixed quotes', () => {
  const result = tokenize('cmd "arg1" \'arg2\'');
  assert.deepEqual(result, [
    { type: 'argument', value: 'cmd', quoted: false },
    { type: 'argument', value: 'arg1', quoted: true },
    { type: 'argument', value: 'arg2', quoted: true },
  ]);
});

test('tokenize unclosed quote', () => {
  const result = tokenize('cmd "unclosed');
  assert.deepEqual(result, [
    { type: 'argument', value: 'cmd', quoted: false },
    { type: 'argument', value: 'unclosed', quoted: true },
  ]);
});

test('tokenize flags with equals', () => {
  const result = tokenize('cmd -f=value');
  assert.deepEqual(result, [
    { type: 'argument', value: 'cmd', quoted: false },
    { type: 'flag', value: '-f=value', quoted: false },
  ]);
});
