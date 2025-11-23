'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { defaultValuesTokens } from '@/spareds/tokens';

interface TokenViewerProps {
  title: string;
  description?: string;
  data: any;
  level: 1 | 2 | 3 | 4;
}

export function TokenViewer({ title, description, data, level }: TokenViewerProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const extractValue = (obj: any): string => {
    if (typeof obj === 'string') return obj;
    if (obj?.value) {
      const val = obj.value;
      if (typeof val === 'string') {
        // Handle references like {color.primary.500} - extract the path
        if (val.startsWith('{') && val.endsWith('}')) {
          return val; // Return reference as-is
        }
        return val;
      }
      // Handle references like {color.primary.500}
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return String(val);
    }
    // If it's an object with properties, try to get the first value
    if (obj?.properties && typeof obj.properties === 'object') {
      const firstKey = Object.keys(obj.properties)[0];
      if (firstKey) {
        const firstVal = obj.properties[firstKey];
        if (firstVal?.value) {
          return extractValue(firstVal);
        }
      }
    }
    return '';
  };

  const isColorValue = (value: string): boolean => {
    if (!value || typeof value !== 'string') return false;
    // Check if it's a hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) return true;
    // Check if it's a CSS color function
    if (value.startsWith('rgb') || value.startsWith('hsl')) return true;
    // Check if it's HSL format like "240 87% 62%"
    if (/^\d+\s+\d+%\s+\d+%$/.test(value)) return true;
    // Check if it's a reference that might point to a color
    if (value.startsWith('{') && value.endsWith('}')) {
      // Could be a color reference, we'll try to resolve it
      return true;
    }
    return false;
  };

  const extractColorFromValue = (value: string): string | null => {
    if (!value || typeof value !== 'string') return null;
    // If it's already a hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
    // Try to extract from HSL format like "240 87% 62%"
    const hslMatch = value.match(/(\d+)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
    if (hslMatch) {
      const h = parseInt(hslMatch[1]);
      const s = parseFloat(hslMatch[2]);
      const l = parseFloat(hslMatch[3]);
      return hslToHex(h, s, l);
    }
    // If it's a reference, try to resolve it by looking up in default values
    if (value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      // Try to resolve common color references
      if (refPath.includes('default-values')) {
        // Extract the color path
        const colorMatch = refPath.match(/default-values\.(primary|gray|blue|green|red|amber|orange|purple|pink|cyan|lime)\.(.*)/);
        if (colorMatch) {
          // This is a reference, we can't resolve it here but we know it's likely a color
          return null; // Will show as reference
        }
      }
    }
    return null;
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Helper to get nested value from object by path
  const getNestedValue = (obj: any, path: string): any => {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  };

  // Try to resolve color from default values if it's a reference
  const resolveColorReference = (value: string): string | null => {
    if (!value || typeof value !== 'string') return null;
    
    // If it's a reference like {default-values.primary.blue-500}
    if (value.startsWith('{') && value.endsWith('}')) {
      const refPath = value.slice(1, -1);
      
      // Try to extract and resolve from default values
      try {
        const parts = refPath.split('.');
        if (parts[0] === 'default-values' && parts.length >= 3) {
          // Remove 'default-values' prefix
          const pathWithoutPrefix = parts.slice(1).join('.');
          const resolved = getNestedValue(defaultValuesTokens, pathWithoutPrefix);
          
          if (resolved) {
            // Extract value from resolved object
            const resolvedValue = extractValue(resolved);
            if (resolvedValue) {
              return extractColorFromValue(resolvedValue);
            }
          }
        }
      } catch (e) {
        // Ignore errors
      }
      
      // If we can't resolve, return null to show as reference
      return null;
    }
    
    return extractColorFromValue(value);
  };

  const flattenTokens = (obj: any, prefix = '', depth = 0): Array<{
    key: string;
    fullKey: string;
    value: string;
    description?: string;
    hasChildren: boolean;
    depth: number;
  }> => {
    const result: Array<{
      key: string;
      fullKey: string;
      value: string;
      description?: string;
      hasChildren: boolean;
      depth: number;
    }> = [];

    if (!obj || typeof obj !== 'object') return result;

    // Handle JSON schema structure
    let entries: Array<[string, any]>;
    if (obj.properties) {
      entries = Object.entries(obj.properties);
    } else if (obj.color) {
      // Handle foundation tokens structure
      entries = Object.entries(obj.color);
    } else {
      entries = Object.entries(obj);
    }

    for (const [key, val] of entries) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const tokenValue = extractValue(val as any);
      
      // Check if it has nested properties
      const hasNestedProperties = val && typeof val === 'object' && 
        ((val as any).properties || (Object.keys(val as any).length > 0 && !(val as any).value));

      result.push({
        key,
        fullKey,
        value: tokenValue,
        description: (val as any)?.description,
        hasChildren: !!hasNestedProperties,
        depth,
      });

      // Recursively process nested objects
      if (hasNestedProperties && !tokenValue) {
        const nested = flattenTokens(val, fullKey, depth + 1);
        result.push(...nested);
      }
    }

    return result;
  };

  const tokens = flattenTokens(data);
  const colorTokens = tokens.filter(t => isColorValue(t.value) || extractColorFromValue(t.value));
  const otherTokens = tokens.filter(t => !isColorValue(t.value) && !extractColorFromValue(t.value));

  const levelColors = {
    1: 'bg-muted',
    2: 'bg-blue-50 dark:bg-blue-950',
    3: 'bg-purple-50 dark:bg-purple-950',
    4: 'bg-pink-50 dark:bg-pink-950',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{title}</CardTitle>
              {description && (
                <CardDescription>{description}</CardDescription>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${levelColors[level]}`}>
              Level {level}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Color Tokens Table */}
          {colorTokens.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Colors</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Token</TableHead>
                      <TableHead className="w-[180px]">Color</TableHead>
                      <TableHead className="w-[200px]">Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colorTokens.map((token) => {
                      const color = resolveColorReference(token.value) || extractColorFromValue(token.value);
                      const isHex = color && /^#[0-9A-Fa-f]{6}$/.test(color);
                      const isReference = token.value.startsWith('{') && token.value.endsWith('}');
                      
                      return (
                        <TableRow key={token.fullKey}>
                          <TableCell>
                            <code className="text-sm font-mono text-foreground">
                              {token.fullKey}
                            </code>
                          </TableCell>
                          <TableCell>
                            {isHex && (
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-20 h-20 rounded-lg border-2 border-border shadow-md flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-mono font-semibold text-foreground">
                                    {color.toUpperCase()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Hex
                                  </div>
                                </div>
                              </div>
                            )}
                            {!isHex && isReference && (
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-primary/50 bg-muted/30 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-semibold text-primary">REF</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <div className="text-xs font-mono text-muted-foreground">
                                    Referência
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {token.value.slice(1, -1)}
                                  </div>
                                </div>
                              </div>
                            )}
                            {!isHex && !isReference && (
                              <div className="flex items-center gap-3">
                                <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs text-muted-foreground">N/A</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Not a color
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground break-all">
                              {token.value}
                            </code>
                          </TableCell>
                          <TableCell>
                            {token.description && (
                              <span className="text-sm text-muted-foreground">
                                {token.description}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="small"
                              onClick={() => copyToClipboard(token.value, token.fullKey)}
                              className="text-xs text-primary"
                            >
                              {copiedKey === token.fullKey ? '✓ Copied' : '📋 Copy'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Other Tokens Table */}
          {otherTokens.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Other Tokens</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Token</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {otherTokens.map((token) => (
                      <TableRow key={token.fullKey}>
                        <TableCell>
                          <code className="text-sm font-mono text-foreground">
                            {token.fullKey}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-foreground">
                            {token.value || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {token.description && (
                            <span className="text-sm text-muted-foreground">
                              {token.description}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {token.value && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="small"
                              onClick={() => copyToClipboard(token.value, token.fullKey)}
                              className="text-xs text-primary"
                            >
                              {copiedKey === token.fullKey ? '✓' : '📋'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
