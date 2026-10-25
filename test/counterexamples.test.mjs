import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// SEC-01: intentionally unsafe toy rule. It checks for one allowed image,
// not whether the same line also contains another, unapproved reference.
function existenceOnlyImageGate(line) {
  return /<img\\b[^>]*src=["']\\/assets\\/demo\\.svg["']/i.test(line);
}

test('SEC-01 reproduces an existence-only image check accepting a second reference', () => {
  const line = '<img src="/assets/demo.svg" alt="demo"> ![foreign](../foreign/demo.svg)';
  assert.equal(existenceOnlyImageGate(line), true);
  assert.match(line, /!\\[foreign\\]\\(\\.\\.\\/foreign\\/demo\\.svg\\)/);
});

// SEC-02: intentionally unsafe toy flow. It validates a pathname, then opens
// that pathname again after a caller-controlled gap. This is not production code.
function unsafeCheckThenRead(root, relativePath, betweenCheckAndRead) {
  const rootPrefix = `${path.resolve(root)}${path.sep}`;
  const candidate = path.resolve(root, relativePath);
  if (!candidate.startsWith(rootPrefix)) throw new Error('outside lexical root');
  const checkedPath = fs.realpathSync(candidate);
  if (!checkedPath.startsWith(rootPrefix)) throw new Error('outside resolved root');
  betweenCheckAndRead();
  return fs.readFileSync(candidate, 'utf8');
}

test('SEC-02 reproduces a path changing after validation and before open', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'review-counterexample-'));
  try {
    const root = path.join(temp, 'root');
    const outside = path.join(temp, 'outside');
    const assets = path.join(root, 'assets');
    fs.mkdirSync(assets, { recursive: true });
    fs.mkdirSync(outside);
    fs.writeFileSync(path.join(assets, 'demo.txt'), 'inside fixture');
    fs.writeFileSync(path.join(outside, 'demo.txt'), 'outside sentinel');

    const result = unsafeCheckThenRead(root, 'assets/demo.txt', () => {
      fs.renameSync(assets, path.join(root, 'assets-before-swap'));
      fs.symlinkSync(outside, assets, 'dir');
    });
    assert.equal(result, 'outside sentinel');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

// SEC-03: a tiny text fixture checker, not an SVG/CSS parser.
function finalFrameExplicitlyVisible(css) {
  const finalRule = css.match(/#final\\s*\\{([^}]*)\\}/)?.[1] ?? '';
  return /\\bopacity\\s*:\\s*1\\b/.test(finalRule);
}

test('SEC-03 shows that stopping animation does not itself reveal a transparent final frame', () => {
  const css = `
    .frame { opacity: 0; }
    @media (prefers-reduced-motion: reduce) {
      #first { animation: none; opacity: 1; }
      #final { animation: none; }
    }
  `;
  assert.match(css, /prefers-reduced-motion:\\s*reduce/);
  assert.match(css, /#final\\s*\\{\\s*animation:\\s*none;\\s*\\}/);
  assert.equal(finalFrameExplicitlyVisible(css), false);
});

// SEC-04: intentionally naive source-text counting. It is not a Markdown parser.
function countImageTagsWithRegex(source) {
  return (source.match(/<img\\b/gi) ?? []).length;
}

test('SEC-04 reproduces a regex counting an image tag inside an HTML comment', () => {
  const source = "<!-- <img src='/demo.svg' alt='demo'> -->";
  assert.equal(countImageTagsWithRegex(source), 1);
  const sourceOutsideComments = source.replace(/<!--[\\s\\S]*?-->/g, '');
  assert.equal(countImageTagsWithRegex(sourceOutsideComments), 0);
});
