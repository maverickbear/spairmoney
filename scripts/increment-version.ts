#!/usr/bin/env tsx
/**
 * Increments the version number in package.json
 * This script is run automatically before each deployment
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const packageJsonPath = join(process.cwd(), 'package.json');

function incrementVersion(version: string): string {
  const parts = version.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${version}. Expected format: x.y.z`);
  }

  const [major, minor, patch] = parts.map(Number);
  const newPatch = patch + 1;
  
  return `${major}.${minor}.${newPatch}`;
}

try {
  // Read package.json
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const currentVersion = packageJson.version;
  
  // Increment version
  const newVersion = incrementVersion(currentVersion);
  
  // Update package.json
  packageJson.version = newVersion;
  writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf-8'
  );
  
  console.log(`Version incremented: ${currentVersion} → ${newVersion}`);
  process.exit(0);
} catch (error) {
  console.error('Error incrementing version:', error);
  process.exit(1);
}

