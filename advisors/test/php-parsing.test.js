import { test } from "node:test";
import assert from "node:assert/strict";
import { maskPhpStrings, extractBalancedParens, findLineNumber } from "../framework/php-parsing.js";

// ---------------------------------------------------------------------
// maskPhpStrings
// ---------------------------------------------------------------------

test("masks single-quoted string contents with spaces, preserving length", () => {
  const input = "echo 'hello';";
  const result = maskPhpStrings(input);
  assert.equal(result.length, input.length);
  assert.match(result, /^echo\s+;$/);
  assert.ok(!result.includes("hello"));
});

test("masks double-quoted string contents with spaces, preserving length", () => {
  const input = 'echo "hello";';
  const result = maskPhpStrings(input);
  assert.equal(result.length, input.length);
  assert.match(result, /^echo\s+;$/);
  assert.ok(!result.includes("hello"));
});

test("handles escaped quotes inside a string without ending the string early", () => {
  const input = "echo 'it\\'s here';";
  const result = maskPhpStrings(input);
  assert.ok(!result.includes("'"), "no literal quote characters should remain unmasked mid-string");
});

test("handles escaped double-quotes inside a double-quoted string", () => {
  const input = 'echo "she said \\"hi\\"";';
  const result = maskPhpStrings(input);
  assert.equal(result.length, input.length);
});

test("does not mask characters outside string literals", () => {
  const input = "foo(bar, baz);";
  const result = maskPhpStrings(input);
  assert.equal(result, input);
});

test("preserves newlines inside multi-line strings", () => {
  const input = "echo 'line1\nline2';";
  const result = maskPhpStrings(input);
  assert.ok(result.includes("\n"));
  assert.equal(result.split("\n").length, input.split("\n").length);
});

test("comments are not specially treated -- parens inside a // comment remain unmasked (advisors that care about comments handle that separately)", () => {
  const input = "// comment with (paren)\necho $x;";
  const result = maskPhpStrings(input);
  assert.equal(result, input);
});

// ---------------------------------------------------------------------
// extractBalancedParens
// ---------------------------------------------------------------------

test("extracts a simple balanced call", () => {
  const content = "foo(bar, baz);";
  const openIdx = content.indexOf("(");
  assert.equal(extractBalancedParens(content, openIdx), "(bar, baz)");
});

test("nested constructs: a paren inside a string argument does not corrupt depth counting", () => {
  const content = "foo(bar, 'a(b)c', baz);";
  const openIdx = content.indexOf("(");
  assert.equal(extractBalancedParens(content, openIdx), "(bar, 'a(b)c', baz)");
});

test("nested constructs: a real regex-route-style string with parens (REST route pattern) extracts correctly", () => {
  const content = "register_rest_route('ns', '/items/(?P<id>[0-9]+)', array('methods' => 'GET'));";
  const openIdx = content.indexOf("(");
  const extracted = extractBalancedParens(content, openIdx);
  assert.ok(extracted.startsWith("("));
  assert.ok(extracted.endsWith(")"));
  assert.ok(extracted.includes("(?P<id>[0-9]+)"), "the string's own parens must be preserved verbatim in the unmasked return value");
});

test("multi-line calls extract correctly across newlines", () => {
  const content = "foo(\n  bar,\n  baz\n);";
  const openIdx = content.indexOf("(");
  const extracted = extractBalancedParens(content, openIdx);
  assert.ok(extracted.includes("\n"));
  assert.ok(extracted.startsWith("(") && extracted.endsWith(")"));
});

test("malformed PHP: unbalanced (never-closed) parens fall back to a bounded window rather than throwing or scanning unbounded", () => {
  const content = "foo(bar, baz";
  const openIdx = content.indexOf("(");
  assert.doesNotThrow(() => extractBalancedParens(content, openIdx));
  const result = extractBalancedParens(content, openIdx);
  assert.equal(result, "(bar, baz");
});

test("nested balanced parens (a call within a call) extract the full outer span", () => {
  const content = "outer(inner(a, b), c);";
  const openIdx = content.indexOf("(");
  assert.equal(extractBalancedParens(content, openIdx), "(inner(a, b), c)");
});

// ---------------------------------------------------------------------
// findLineNumber
// ---------------------------------------------------------------------

test("returns 1 for an index on the first line", () => {
  assert.equal(findLineNumber("hello world", 3), 1);
});

test("returns the correct line number across multiple lines", () => {
  const content = "line1\nline2\nline3";
  assert.equal(findLineNumber(content, content.indexOf("line3")), 3);
});

test("returns the correct line number for an index exactly at a newline boundary", () => {
  const content = "a\nb\nc";
  const secondNewlineIndex = content.indexOf("\n", content.indexOf("\n") + 1);
  assert.equal(findLineNumber(content, secondNewlineIndex + 1), 3);
});

// ---------------------------------------------------------------------
// never throws for malformed/edge-case input
// ---------------------------------------------------------------------

test("never throws for empty content", () => {
  assert.doesNotThrow(() => maskPhpStrings(""));
  assert.doesNotThrow(() => findLineNumber("", 0));
});

test("never throws for an unterminated string literal (malformed PHP)", () => {
  assert.doesNotThrow(() => maskPhpStrings("echo 'never closed"));
});
