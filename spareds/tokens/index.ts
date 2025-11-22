/**
 * Spare Design System Tokens
 * 
 * Central export for all design tokens following the 4-level hierarchy:
 * 1. Default Values - Raw color values
 * 2. Foundation Tokens - Primitive color scales
 * 3. Semantic Tokens - Purpose-driven tokens
 * 4. Component Tokens - Component-specific tokens
 */

// Import token files
import defaultValuesRaw from './colors/default-values.json';
import foundationTokensRaw from './colors/foundation-tokens.json';
import semanticTokensRaw from './colors/semantic-tokens.json';
import componentTokensRaw from './colors/component-tokens.json';

/**
 * Helper to extract values from JSON schema structure
 */
function extractValues(obj: any): any {
  if (obj && typeof obj === 'object') {
    // If it has a 'value' property, return it
    if ('value' in obj) {
      return obj.value;
    }
    // If it has a 'properties' key (JSON schema), extract from properties
    if ('properties' in obj) {
      const result: any = {};
      for (const [key, value] of Object.entries(obj.properties)) {
        result[key] = extractValues(value);
      }
      return result;
    }
    // Otherwise, recursively process all properties
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = extractValues(value);
    }
    return result;
  }
  return obj;
}

/**
 * Default Values (Level 1)
 * Raw hexadecimal color codes and primitive values
 */
export const defaultValuesTokens = extractValues(defaultValuesRaw);

/**
 * Foundation Tokens (Level 2)
 * Primitive color scales organized by color family
 */
export const foundationTokensTokens = extractValues(foundationTokensRaw);

/**
 * Semantic Tokens (Level 3)
 * Purpose-driven color tokens (text, background, border, etc.)
 */
export const semanticTokensTokens = extractValues(semanticTokensRaw);

/**
 * Component Tokens (Level 4)
 * Component-specific color tokens (button, card, input, etc.)
 */
export const componentTokensTokens = extractValues(componentTokensRaw);

/**
 * All tokens combined
 */
export const tokens = {
  defaultValues: defaultValuesTokens,
  foundation: foundationTokensTokens,
  semantic: semanticTokensTokens,
  component: componentTokensTokens,
};

/**
 * Helper function to get a token value by path
 * Example: getToken('component.button.primary.bg')
 */
export function getToken(path: string): string | undefined {
  const parts = path.split('.');
  let current: any = tokens;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  // If the final value has a 'value' property, return it
  if (current && typeof current === 'object' && 'value' in current) {
    return current.value;
  }
  
  // If it's a string, return it directly
  if (typeof current === 'string') {
    return current;
  }
  
  return current;
}

/**
 * Helper function to resolve token references
 * Tokens can reference other tokens using {token.path} syntax
 */
export function resolveToken(tokenValue: string): string {
  if (typeof tokenValue !== 'string') {
    return tokenValue;
  }
  
  // Match {token.path} patterns
  const referencePattern = /\{([^}]+)\}/g;
  let resolved = tokenValue;
  let match;
  
  while ((match = referencePattern.exec(tokenValue)) !== null) {
    const referencePath = match[1];
    const resolvedValue = getToken(referencePath);
    
    if (resolvedValue) {
      resolved = resolved.replace(match[0], resolvedValue);
    }
  }
  
  return resolved;
}

/**
 * Color token exports for easy access
 */
export const colors = {
  defaultValues: defaultValuesTokens,
  foundation: foundationTokensTokens.color || foundationTokensTokens,
  semantic: semanticTokensTokens.color || semanticTokensTokens,
  component: componentTokensTokens,
};

/**
 * Default export
 */
export default tokens;

