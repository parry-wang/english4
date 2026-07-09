// This is an alias for generate-reading.cjs
// Run with: node /workspace/scripts/generate-reading.cjs
// Or use: node /workspace/scripts/generate-reading.js (this file)
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const cjsPath = path.join(path.dirname(__filename), 'generate-reading.cjs');
execSync(`node "${cjsPath}"`, { stdio: 'inherit' });
