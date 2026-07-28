import dotenv from "dotenv";
import path from "path";
import fs from "fs";

export let loadedEnvPath = "";

const path1 = path.resolve(process.cwd(), ".env");
const path2 = path.resolve(process.cwd(), "apps/api/.env");

if (fs.existsSync(path1)) {
  loadedEnvPath = path1;
} else if (fs.existsSync(path2)) {
  loadedEnvPath = path2;
}

if (loadedEnvPath) {
  dotenv.config({ path: loadedEnvPath });
}
