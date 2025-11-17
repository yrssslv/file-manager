import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from '../../src/utils/tokenizer.mjs';

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
