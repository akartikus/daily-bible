#!/usr/bin/env node
// Check that popup bundle size is under 300 kB gzipped

import { gzipSync } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIST_DIR = "dist/assets";
const MAX_SIZE_KB = 300;

function main() {
  try {
    const files = readdirSync(DIST_DIR);
    // Find the main popup JS bundle (index.html-*.js)
    const popupBundle = files.find(
      (f) => f.startsWith("index.html-") && f.endsWith(".js"),
    );

    if (!popupBundle) {
      console.error("❌ Popup bundle not found in dist/assets/");
      process.exit(1);
    }

    const bundlePath = join(DIST_DIR, popupBundle);
    const content = readFileSync(bundlePath);
    const gzipped = gzipSync(content);
    const sizeKB = gzipped.length / 1024;

    console.log(`📦 Popup bundle: ${popupBundle}`);
    console.log(`📦 Gzipped size: ${sizeKB.toFixed(2)} kB`);

    if (sizeKB > MAX_SIZE_KB) {
      console.error(
        `❌ Bundle size ${sizeKB.toFixed(2)} kB exceeds limit of ${MAX_SIZE_KB} kB`,
      );
      process.exit(1);
    }

    console.log(
      `✅ Bundle size ${sizeKB.toFixed(2)} kB is under ${MAX_SIZE_KB} kB limit`,
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking bundle size:", error.message);
    process.exit(1);
  }
}

main();
