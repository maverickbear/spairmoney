/**
 * Ensures en.json, pt.json, and es.json have the same key structure.
 * Exits with 1 if any locale is missing keys that exist in en.json.
 * Run in CI or before release: npm run check:i18n-keys
 */
import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const LOCALES = ["en", "pt", "es"] as const;

function getAllKeyPaths(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") {
    return prefix ? [prefix] : [];
  }
  const keys: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = (obj as Record<string, unknown>)[key];
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...getAllKeyPaths(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadMessages(locale: string): Record<string, unknown> {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing file: ${filePath}`);
    process.exit(1);
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch (e) {
    console.error(`Invalid JSON in ${filePath}:`, e);
    process.exit(1);
  }
}

function main() {
  const en = loadMessages("en");
  const enKeys = new Set(getAllKeyPaths(en));
  let hasError = false;

  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const data = loadMessages(locale);
    const localeKeys = new Set(getAllKeyPaths(data));
    const missing = [...enKeys].filter((k) => !localeKeys.has(k));
    if (missing.length > 0) {
      hasError = true;
      console.error(`\n[${locale}.json] Missing ${missing.length} key(s) present in en.json:`);
      missing.slice(0, 30).forEach((k) => console.error(`  - ${k}`));
      if (missing.length > 30) {
        console.error(`  ... and ${missing.length - 30} more`);
      }
    }
  }

  if (hasError) {
    console.error("\nAdd the missing keys to pt.json and es.json (copy from en if needed).");
    process.exit(1);
  }
  console.log("i18n keys: en, pt, es are in sync.");
}

main();
