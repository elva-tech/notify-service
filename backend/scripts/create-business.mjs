/**
 * Scaffold a new business configuration folder from templates.
 * Usage: node backend/scripts/create-business.mjs <businessId> [--display-name "Name"]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, '..');
const templatesRoot = path.join(backendRoot, 'config', 'templates');
const businessesRoot = path.join(backendRoot, 'config', 'businesses');

const BUSINESS_ID_PATTERN = /^[a-z][a-z0-9-]*$/;

function usage() {
  console.error('Usage: node backend/scripts/create-business.mjs <businessId> [--display-name "Display Name"]');
  process.exit(1);
}

function titleCase(value) {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function stripDocFields(obj) {
  if (Array.isArray(obj)) {
    return obj.map(stripDocFields);
  }
  if (obj != null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('_')) {
        continue;
      }
      result[key] = stripDocFields(value);
    }
    return result;
  }
  return obj;
}

function loadTemplate(filename) {
  const templatePath = path.join(templatesRoot, filename);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing template: ${templatePath}`);
  }
  return JSON.parse(fs.readFileSync(templatePath, 'utf8'));
}

function parseArgs(argv) {
  if (argv.length < 1) {
    usage();
  }
  const businessId = argv[0].trim();
  let displayName = titleCase(businessId);

  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === '--display-name' && argv[i + 1]) {
      displayName = argv[i + 1].trim();
      i += 1;
    }
  }

  return { businessId, displayName };
}

const { businessId, displayName } = parseArgs(process.argv.slice(2));

if (!BUSINESS_ID_PATTERN.test(businessId)) {
  console.error(`FAIL: businessId "${businessId}" must match ${BUSINESS_ID_PATTERN}`);
  process.exit(1);
}

const businessDir = path.join(businessesRoot, businessId);
if (fs.existsSync(businessDir)) {
  console.error(`FAIL: Business folder already exists: ${businessDir}`);
  process.exit(1);
}

const businessTemplate = stripDocFields(loadTemplate('business.template.json'));
const templatesTemplate = stripDocFields(loadTemplate('templates.template.json'));

businessTemplate.businessId = businessId;
businessTemplate.displayName = displayName;
businessTemplate.version = 'v1';

fs.mkdirSync(businessDir, { recursive: true });
fs.writeFileSync(
  path.join(businessDir, 'business.json'),
  `${JSON.stringify(businessTemplate, null, 2)}\n`,
  'utf8',
);
fs.writeFileSync(
  path.join(businessDir, 'templates.json'),
  `${JSON.stringify(templatesTemplate, null, 2)}\n`,
  'utf8',
);

console.log('Created business configuration:');
console.log(`  ${path.join('backend/config/businesses', businessId, 'business.json')}`);
console.log(`  ${path.join('backend/config/businesses', businessId, 'templates.json')}`);
console.log('');
console.log('Next steps:');
console.log('  1. Replace DLT placeholders in business.json and templates.json');
console.log('  2. Optionally add OTP mapping in backend/config/otp-mappings.json');
console.log('  3. Run: npm run validate:businesses');
console.log('  4. Restart backend and rebuild frontend manifest');
