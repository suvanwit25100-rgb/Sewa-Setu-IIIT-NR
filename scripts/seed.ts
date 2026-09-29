// Explicit seed entrypoint (`npm run db:seed`). The app also auto-seeds an
// empty database on first request, so this script exists mainly for
// `npm run db:reset` — wiping and rebuilding deterministically on demand.
import { resetDatabase, dbStats } from "../src/lib/db";

resetDatabase();
console.log("Seeded fresh database:");
console.log(JSON.stringify(dbStats(), null, 2));
