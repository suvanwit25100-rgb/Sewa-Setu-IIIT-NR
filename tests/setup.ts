import os from "node:os";
import path from "node:path";
import fs from "node:fs";

// Point the app at an isolated, throwaway SQLite file for the whole test
// run — never the dev server's own data/sewasetu.db.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sewasetu-test-"));
process.env.SEWASETU_DB_DIR = dir;
