/**
 * Fix Employee Avatar URLs
 * Replaces old DiceBear avataaars URLs with clean bottts style URLs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Avatar generation function (matching avatar-utils.ts)
function buildDiceBearUrl(seed) {
  const normalizedSeed = seed.trim() || 'ai-workforce';
  const params = new URLSearchParams({
    seed: normalizedSeed,
    backgroundColor: 'EEF2FF,E0F2FE,F0F9FF',
    radius: '50',
    size: '128',
  });

  const query = params.toString().replace(/\+/g, '%20');
  return `https://api.dicebear.com/7.x/bottts/svg?${query}`;
}

function getAIEmployeeAvatar(employeeName) {
  const normalized = employeeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/^-+|-+$/g, '');

  return buildDiceBearUrl(normalized || 'ai-workforce');
}

// Read marketplace-employees.ts
const filePath = join(__dirname, '..', 'src', 'data', 'marketplace-employees.ts');
let content = readFileSync(filePath, 'utf-8');

console.log('🔧 Fixing employee avatar URLs...');

// Extract all employee objects and fix their avatars
const employeePattern = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',[\s\S]*?avatar:\s*'([^']+)',/g;
let match;
let fixedCount = 0;

const matches = [];
while ((match = employeePattern.exec(content)) !== null) {
  matches.push({
    fullMatch: match[0],
    id: match[1],
    name: match[2],
    oldAvatar: match[3],
    index: match.index
  });
}

// Process in reverse order to maintain correct indices
matches.reverse().forEach(({ fullMatch, name, oldAvatar, index }) => {
  // Generate new avatar URL
  const newAvatar = getAIEmployeeAvatar(name);

  // Replace the avatar URL in the matched section
  const updatedMatch = fullMatch.replace(
    /avatar:\s*'[^']+'/,
    `avatar: '${newAvatar}'`
  );

  content = content.substring(0, index) + updatedMatch + content.substring(index + fullMatch.length);
  fixedCount++;

  console.log(`✓ Fixed: ${name}`);
});

// Write back to file
writeFileSync(filePath, content, 'utf-8');

console.log(`\n✅ Successfully fixed ${fixedCount} employee avatars!`);
console.log('📝 Updated: src/data/marketplace-employees.ts');
console.log('\n🎨 New avatar format: DiceBear bottts style with clean parameters');
