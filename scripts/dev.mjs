import { execSync } from "node:child_process";
import { createConnection } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DB_HOST_PORT, LAN_IP } from "./config.mjs";
import { getLanIp } from "./network.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lanMode = process.env.DEV_LAN === "1" || process.env.DEV_LAN === "true";

function run(cmd, cwd = root, env = process.env) {
  execSync(cmd, { stdio: "inherit", cwd, shell: true, env });
}

function waitForPort(port, host = "127.0.0.1", timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryConnect = () => {
      const socket = createConnection({ port, host });
      socket.on("connect", () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(tryConnect, 1000);
      });
    };
    tryConnect();
  });
}

console.log("=== Starting Debt Tracker ===\n");
if (lanMode) {
  console.log("LAN mode enabled — reachable from other devices on your Wi‑Fi\n");
}

console.log("Ensuring PostgreSQL is running...");
try {
  run("docker compose up -d");
  await waitForPort(DB_HOST_PORT);
} catch (err) {
  console.error("\nCould not start PostgreSQL.");
  console.error(err.message);
  console.error("Start Docker Desktop, then run: npm run dev\n");
  process.exit(1);
}

console.log("Applying migrations...");
try {
  run("python -m alembic upgrade head", join(root, "backend"));
} catch {
  console.warn("Migration skipped (run npm run setup if this is a fresh install).");
}

const env = { ...process.env };
env.CORS_ORIGINS =
  "http://localhost:3000,http://127.0.0.1:3000";

const backendScript = lanMode ? "backend:dev:lan" : "backend:dev";
const frontendScript = lanMode ? "frontend:dev:lan" : "frontend:dev";

console.log("\nStarting backend (:8000) and frontend (:3000)...\n");
console.log("  On this PC:");
console.log("    App: http://localhost:3000");
console.log("    API: http://localhost:8000/docs");

if (lanMode) {
  const lanIp = process.env.LAN_IP || LAN_IP || getLanIp();
  if (lanIp) {
    env.CORS_ORIGINS += `,http://${lanIp}:3000`;
    env.NEXT_PUBLIC_API_URL = `http://${lanIp}:8000`;
    console.log("\n  On your phone/tablet (same Wi‑Fi):");
    console.log(`    App: http://${lanIp}:3000`);
    console.log(`    API: http://${lanIp}:8000/docs`);
    console.log(
      "\n  If the phone cannot connect, allow ports 3000 and 8000 in Windows Firewall."
    );
  } else {
    console.warn("\n  Could not detect LAN IP — falling back to localhost only.");
  }
}

console.log("");

run(
  `npx concurrently -n api,web -c cyan,magenta "npm run ${backendScript}" "npm run ${frontendScript}"`,
  root,
  env
);
