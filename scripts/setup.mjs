import { execSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { createConnection } from "node:net";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DB_HOST_PORT } from "./config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, cwd = root) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: "inherit", cwd, shell: true });
}

function copyEnvIfMissing(src, dest) {
  const srcPath = join(root, src);
  const destPath = join(root, dest);
  if (!existsSync(destPath)) {
    copyFileSync(srcPath, destPath);
    console.log(`Created ${dest} from ${src}`);
  } else {
    console.log(`${dest} already exists, skipping`);
  }
}

function waitForPort(port, host = "127.0.0.1", timeoutMs = 60000) {
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

console.log("=== Debt Tracker setup ===\n");

copyEnvIfMissing("backend/.env.example", "backend/.env");
copyEnvIfMissing("frontend/.env.example", "frontend/.env.local");

console.log("\nStarting PostgreSQL...");
run("docker compose up -d");

console.log(`\nWaiting for PostgreSQL on port ${DB_HOST_PORT}...`);
try {
  await waitForPort(DB_HOST_PORT);
  console.log("PostgreSQL is ready.");
} catch (err) {
  console.error(err.message);
  console.error(
    "Make sure Docker Desktop is running, then run: npm run setup"
  );
  process.exit(1);
}

console.log("\nInstalling Python dependencies...");
run("pip install -r backend/requirements.txt");

console.log("\nInstalling frontend dependencies...");
run("npm install --prefix frontend");

console.log("\nRunning database migrations...");
run("python -m alembic upgrade head", join(root, "backend"));

console.log("\n=== Setup complete ===");
console.log("Run the app with: npm run dev");
console.log("  App:  http://localhost:3000");
console.log("  API:  http://localhost:8000/docs");
