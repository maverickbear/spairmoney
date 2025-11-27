#!/usr/bin/env tsx
/**
 * Pre-build script that increments version only on Vercel/production deployments
 * This prevents version increments during local development
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Only increment version on Vercel or CI environments
if (process.env.VERCEL || process.env.CI) {
  console.log('Production build detected, incrementing version...');
  
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
  } catch (error) {
    console.error('Error incrementing version:', error);
    process.exit(1);
  }
} else {
  console.log('Local build detected, skipping version increment');
}

