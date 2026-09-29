const fs = require("fs");
const path = require("path");
const testDir = path.join(process.cwd(), "apps", "api", "tests");
const files = fs.readdirSync(testDir).filter((f) => f.endsWith(".test.ts"));
for (const file of files) {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, "utf-8");
  if (content.includes("MongoMemoryServer") || content.includes("setupTestDB")) continue;

  content = content.replace(
    /const baseMongoUri = process\.env\.MONGO_URI;[\s\S]*?const TEST_MONGO_URI = parsedUri\.toString\(\);/,
    'import { setupTestDB, teardownTestDB } from "./setup/test-db.js";'
  );
  content = content.replace(
    /if\s*\(\s*mongoose\.connection\.readyState\s*!==\s*0\s*\)\s*\{[\s\S]*?await\s*mongoose\.disconnect\(\);\s*\}/g,
    ""
  );
  content = content.replace(/await mongoose\.connect\(TEST_MONGO_URI\);/g, "await setupTestDB();");
  content = content.replace(
    /mongoose\.connect\(TEST_MONGO_URI\)\.then\(\(\)\s*=>\s*\{/g,
    "setupTestDB().then(() => {"
  );
  content = content.replace(/await mongoose\.disconnect\(\);/g, "await teardownTestDB();");

  fs.writeFileSync(filePath, content);
}
