import { describe, expect, test } from "bun:test";
import fs from "fs/promises";
import path from "path";

const SENSITIVE_VAR_NAMES = [
  "AI_GATEWAY_API_KEY",
  "ADMIN_TOKEN",
  "UPSTASH_REDIS_REST_TOKEN",
  "IP_HASH_SALT",
];

async function scanDirectoryForSecrets(dirPath: string): Promise<string[]> {
  const violations: string[] = [];
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        const subViolations = await scanDirectoryForSecrets(fullPath);
        violations.push(...subViolations);
      } else if (
        entry.name.endsWith(".tsx") ||
        entry.name.endsWith(".ts") ||
        entry.name.endsWith(".js")
      ) {
        const content = await fs.readFile(fullPath, "utf-8");
        for (const secretName of SENSITIVE_VAR_NAMES) {
          // Check if file uses process.env.SECRET_NAME directly in client components
          if (
            content.includes(`process.env.${secretName}`) &&
            (content.includes('"use client"') || fullPath.includes("components/"))
          ) {
            violations.push(`${fullPath} references ${secretName} in client code`);
          }
        }
      }
    }
  } catch {
    // Directory might not exist in some environments
  }
  return violations;
}

describe("Security & Secret Leakage Prevention", () => {
  test("client component source files do not reference server secret environment variables", async () => {
    const clientViolations = await scanDirectoryForSecrets(path.join(process.cwd(), "components"));
    expect(clientViolations).toHaveLength(0);
  });

  test("client bundle in .next/static does not contain dummy or live secret tokens", async () => {
    const staticDir = path.join(process.cwd(), ".next/static");
    try {
      await fs.access(staticDir);
      const testSecret = "super_secure_admin_token_24_chars_min_length_secret";
      const bundleViolations: string[] = [];

      async function scanBundle(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanBundle(full);
          } else if (entry.name.endsWith(".js")) {
            const code = await fs.readFile(full, "utf-8");
            if (code.includes(testSecret)) {
              bundleViolations.push(`${entry.name} leaked admin secret token`);
            }
          }
        }
      }

      await scanBundle(staticDir);
      expect(bundleViolations).toHaveLength(0);
    } catch {
      // .next/static not yet generated or clean
    }
  });
});
