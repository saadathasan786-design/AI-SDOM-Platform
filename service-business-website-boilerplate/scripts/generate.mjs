import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname, '..');
const inputPath = process.argv[2];
const outputDir = process.argv[3] || 'dist';

if (!inputPath) {
  console.error('Usage: node scripts/generate.mjs <project-config.json> [output-directory]');
  process.exit(2);
}

const input = JSON.parse(await readFile(resolve(inputPath), 'utf8'));
const template = await readFile(join(root, 'index.html'), 'utf8');

const values = {
  '{{LOCALE}}': input.site.locale || 'en',
  '{{SITE_TITLE}}': input.site.title || input.business.name,
  '{{BUSINESS_NAME}}': input.business.name,
  '{{BUSINESS_DESCRIPTION}}': input.business.description,
  '{{BUSINESS_TAGLINE}}': input.business.tagline || '',
  '{{PRIMARY_SERVICE}}': input.services[0].name,
  '{{PRIMARY_SERVICE_DESCRIPTION}}': input.services[0].description,
  '{{PRIMARY_SERVICE_CTA}}': input.services[0].cta || 'Learn more',
  '{{PHONE}}': input.contact.phone || '',
  '{{EMAIL}}': input.contact.email || '',
  '{{ADDRESS}}': input.contact.address || '',
  '{{PRIMARY_CTA}}': input.services[0].cta || 'Get in touch',
  '{{CURRENT_YEAR}}': String(new Date().getFullYear()),
  '{{HERO_IMAGE_ALT}}': 'Project-provided service business image',
  '{{HERO_MEDIA}}': 'Project-provided media',
  '{{ABOUT_HEADING}}': 'About {{BUSINESS_NAME}}',
  '{{ABOUT_DESCRIPTION}}': input.business.description,
  '{{CONTACT_HEADING}}': 'Contact {{BUSINESS_NAME}}',
  '{{CONTACT_DESCRIPTION}}': 'Use the verified project contact details below.'
};

for (const service of input.services.slice(0, 3)) {
  const index = input.services.indexOf(service) + 1;
  values[`{{SERVICE_${index}_NAME}}`] = service.name;
  values[`{{SERVICE_${index}_DESCRIPTION}}`] = service.description;
  values[`{{SERVICE_${index}_CTA}}`] = service.cta || 'Learn more';
  values[`{{SERVICE_${index}_URL}}`] = service.slug ? `#${service.slug}` : '#contact';
}

let output = template;
for (const [token, value] of Object.entries(values)) {
  output = output.replaceAll(token, String(value));
}

const unresolved = output.match(/{{[A-Z0-9_]+}}/g) || [];
if (unresolved.length) {
  console.error(`Unresolved placeholders: ${[...new Set(unresolved)].join(', ')}`);
  process.exit(1);
}

const destination = resolve(outputDir);
await mkdir(destination, { recursive: true });
await writeFile(join(destination, 'index.html'), output, 'utf8');
await writeFile(join(destination, 'tokens.css'), await readFile(join(root, 'styles/tokens.css'), 'utf8'), 'utf8');
await writeFile(join(destination, 'site.css'), await readFile(join(root, 'styles/site.css'), 'utf8'), 'utf8');

console.log(`Generated service-business website in ${destination}`);
