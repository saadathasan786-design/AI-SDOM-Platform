import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];

function requireFile(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) failures.push(`Missing required file: ${relativePath}`);
  return path;
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const required = [
  'README.md',
  'index.html',
  'config/project.schema.json',
  'config/example.project.json',
  'styles/tokens.css',
  'styles/site.css',
  'tests/README.md'
];
required.map(requireFile);

const indexPath = join(root, 'index.html');
if (existsSync(indexPath)) {
  const html = readFileSync(indexPath, 'utf8');
  assert(html.includes('<!doctype html>'), 'index.html must declare HTML5 doctype');
  assert(/<html\s+lang="[^"]+"/i.test(html), 'index.html must define a language attribute');
  assert(html.includes('meta name="viewport"'), 'index.html must define a viewport');
  assert(html.includes('Skip to content'), 'index.html must provide a skip link');
  assert(/<main\b/i.test(html), 'index.html must contain a main landmark');
  assert(/<nav\b/i.test(html), 'index.html must contain navigation');
  assert(/<h1\b/i.test(html), 'index.html must contain exactly one primary heading');
  assert((html.match(/<h1\b/gi) || []).length === 1, 'index.html must contain exactly one h1');
  assert(!/lorem ipsum/i.test(html), 'index.html must not contain lorem ipsum placeholder content');
}

const cssPath = join(root, 'styles/site.css');
if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf8');
  assert(css.includes(':focus-visible'), 'site.css must define visible keyboard focus');
  assert(css.includes('@media (max-width:'), 'site.css must contain a responsive breakpoint');
  assert(css.includes('prefers-reduced-motion'), 'site.css must respect reduced-motion preference');
}

const examplePath = join(root, 'config/example.project.json');
if (existsSync(examplePath)) {
  const example = readFileSync(examplePath, 'utf8');
  assert(example.includes('{{BUSINESS_NAME}}'), 'example configuration must preserve business placeholders');
  assert(example.includes('{{PRIMARY_SERVICE}}'), 'example configuration must preserve service placeholders');
}

if (failures.length) {
  console.error('VALIDATION FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('VALIDATION PASSED');
console.log('Service-business boilerplate baseline checks passed.');
