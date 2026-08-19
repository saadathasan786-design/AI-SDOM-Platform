import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const templatePath = join(root, 'index.html');
const defaultOutput = join(root, 'dist', 'index.html');

function usage() {
  console.log('Usage: node config/scripts/generate.mjs [project-config.json] [output.html]');
}

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  usage();
  process.exit(0);
}

const configPath = args[0] ? resolve(process.cwd(), args[0]) : join(root, 'config', 'example.project.json');
const outputPath = args[1] ? resolve(process.cwd(), args[1]) : defaultOutput;

if (!existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}
if (!existsSync(configPath)) {
  console.error(`Project configuration not found: ${configPath}`);
  process.exit(1);
}

let config;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error(`Invalid project configuration: ${error.message}`);
  process.exit(1);
}

const replacements = {
  '{{BUSINESS_NAME}}': config.business?.name,
  '{{BUSINESS_DESCRIPTION}}': config.business?.description,
  '{{BUSINESS_TAGLINE}}': config.business?.tagline,
  '{{SERVICE_AREA}}': config.business?.serviceAreas?.[0],
  '{{PRIMARY_SERVICE}}': config.services?.[0]?.name,
  '{{PRIMARY_SERVICE_DESCRIPTION}}': config.services?.[0]?.description,
  '{{PRIMARY_SERVICE_SLUG}}': config.services?.[0]?.slug,
  '{{PRIMARY_SERVICE_CTA}}': config.services?.[0]?.cta,
  '{{PRIMARY_CTA}}': config.site?.primaryCta,
  '{{PHONE}}': config.contact?.phone,
  '{{EMAIL}}': config.contact?.email,
  '{{ADDRESS}}': config.contact?.address,
  '{{DOMAIN}}': config.site?.url,
  '{{SITE_TITLE}}': config.site?.title ?? config.business?.name,
  '{{LOCALE}}': config.site?.locale ?? 'en',
  '{{CURRENT_YEAR}}': String(new Date().getFullYear()),
};

const services = config.services ?? [];
for (let i = 0; i < 3; i += 1) {
  const service = services[i] ?? {};
  replacements[`{{SERVICE_${i + 1}_NAME}}`] = service.name;
  replacements[`{{SERVICE_${i + 1}_DESCRIPTION}}`] = service.description;
  replacements[`{{SERVICE_${i + 1}_URL}}`] = service.slug ? `#${service.slug}` : undefined;
  replacements[`{{SERVICE_${i + 1}_CTA}}`] = service.cta;
}

replacements['{{HERO_IMAGE_ALT}}'] = config.business?.name
  ? `${config.business.name} service`
  : undefined;
replacements['{{HERO_MEDIA}}'] = config.business?.name
  ? `<span aria-hidden="true">${config.business.name}</span>`
  : undefined;
replacements['{{ABOUT_HEADING}}'] = config.business?.name
  ? `About ${config.business.name}`
  : undefined;
replacements['{{ABOUT_DESCRIPTION}}'] = config.business?.description;
replacements['{{CONTACT_HEADING}}'] = 'Get in touch';
replacements['{{CONTACT_DESCRIPTION}}'] = 'Contact us to discuss your service needs.';

let html = readFileSync(templatePath, 'utf8');
for (const [token, value] of Object.entries(replacements)) {
  if (value !== undefined && value !== null && value !== '') {
    html = html.split(token).join(String(value));
  }
}

const unresolved = [...new Set(html.match(/\{\{[A-Z0-9_]+\}\}/g) ?? [])];
if (unresolved.length) {
  console.error('Generation failed: unresolved placeholders remain:');
  unresolved.forEach((token) => console.error(`- ${token}`));
  process.exit(1);
}

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, html, 'utf8');
console.log(`Generated website: ${outputPath}`);
