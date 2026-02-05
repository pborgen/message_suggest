import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "../..");
const localModelRoot = join(projectRoot, "../local-model");

let llamaServerProcess: ChildProcess | null = null;
let localModelProcess: ChildProcess | null = null;
let backendProcess: ChildProcess | null = null;

const LLAMA_PORT = 8081;
const LOCAL_MODEL_PORT = 8080;
const BACKEND_PORT = 3000;

const modelPath = join(localModelRoot, "models/tinyllama.gguf");
const shouldRun = process.env.RUN_LLAMA_TESTS === "1";

let canRun = shouldRun;
if (shouldRun) {
  try {
    const { execSync } = await import("child_process");
    execSync("which llama-server", { stdio: "ignore" });
  } catch {
    canRun = false;
  }

  try {
    const { accessSync, constants } = await import("fs");
    accessSync(modelPath, constants.F_OK);
  } catch {
    canRun = false;
  }
}

// Wait for a service to be ready by polling its health endpoint
async function waitForService(
  url: string,
  timeout = 30000,
  interval = 500
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url, { method: "GET" });
      if (response.ok || response.status === 405) {
        // 405 Method Not Allowed means the server is up, just doesn't support GET
        return;
      }
    } catch (error) {
      // Service not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Service at ${url} did not become ready within ${timeout}ms`);
}

// Kill a process and its children
function killProcess(process: ChildProcess | null, signal: NodeJS.Signals = "SIGTERM") {
  if (!process || process.killed) return;
  
  try {
    // Kill the process group to ensure all children are killed
    if (process.pid) {
      process.kill(signal);
    }
  } catch (error) {
    // Process may already be dead
  }
}

beforeAll(async () => {
  console.log("🚀 Starting integration test with llama.cpp...");

  // Start llama-server
  console.log("📦 Starting llama-server...");
  llamaServerProcess = spawn("llama-server", [
    "-m",
    modelPath,
    "-c",
    "2048",
    "-ngl",
    "1",
    "--port",
    String(LLAMA_PORT)
  ], {
    cwd: localModelRoot,
    stdio: "pipe"
  });

  llamaServerProcess.stdout?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.log(`[llama-server] ${data.toString().trim()}`);
    }
  });

  llamaServerProcess.stderr?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.error(`[llama-server] ${data.toString().trim()}`);
    }
  });

  // Wait for llama-server to be ready (it doesn't have /health, so we check /completion)
  // A 405 Method Not Allowed means the server is up but doesn't accept GET
  await waitForService(`http://localhost:${LLAMA_PORT}/completion`, 30000);

  // Start local-model service
  console.log("🔧 Starting local-model service...");
  localModelProcess = spawn("node", [
    "--env-file=.env",
    "--loader",
    "tsx",
    "src/server.ts"
  ], {
    cwd: localModelRoot,
    env: {
      ...process.env,
      PORT: String(LOCAL_MODEL_PORT),
      LOCAL_ENGINE: "llamacpp",
      LLAMACPP_URL: `http://localhost:${LLAMA_PORT}/completion`
    },
    stdio: "pipe"
  });

  localModelProcess.stdout?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.log(`[local-model] ${data.toString().trim()}`);
    }
  });

  localModelProcess.stderr?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.error(`[local-model] ${data.toString().trim()}`);
    }
  });

  await waitForService(`http://localhost:${LOCAL_MODEL_PORT}/health`, 30000);

  // Start backend service
  console.log("🌐 Starting backend service...");
  backendProcess = spawn("node", [
    "--env-file=.env",
    "--loader",
    "tsx",
    "src/server.ts"
  ], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(BACKEND_PORT),
      MODEL_PROVIDER: "local",
      LOCAL_MODEL_URL: `http://localhost:${LOCAL_MODEL_PORT}/generate`,
      NODE_ENV: "test"
    },
    stdio: "pipe"
  });

  backendProcess.stdout?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.log(`[backend] ${data.toString().trim()}`);
    }
  });

  backendProcess.stderr?.on("data", (data) => {
    if (process.env.DEBUG) {
      console.error(`[backend] ${data.toString().trim()}`);
    }
  });

  await waitForService(`http://localhost:${BACKEND_PORT}/health`, 30000);

  console.log("✅ All services started and ready!");
}, 60000); // 60 second timeout for setup

afterAll(async () => {
  console.log("🛑 Stopping all services...");

  // Stop backend
  if (backendProcess) {
    console.log("   Stopping backend...");
    killProcess(backendProcess);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    killProcess(backendProcess, "SIGKILL");
  }

  // Stop local-model
  if (localModelProcess) {
    console.log("   Stopping local-model...");
    killProcess(localModelProcess);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    killProcess(localModelProcess, "SIGKILL");
  }

  // Stop llama-server
  if (llamaServerProcess) {
    console.log("   Stopping llama-server...");
    killProcess(llamaServerProcess);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    killProcess(llamaServerProcess, "SIGKILL");
  }

  console.log("✅ All services stopped");
}, 30000); // 30 second timeout for cleanup

(canRun ? describe : describe.skip)("integration with llama.cpp", () => {
  const baseUrl = `http://localhost:${BACKEND_PORT}`;

  it("GET /health returns ok", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.provider).toBe("local");
  });

  it("POST /suggest returns suggestions from local LLM", async () => {
    const res = await fetch(`${baseUrl}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Are we still on for 7?", tone: "polite" })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.short).toBeDefined();
    expect(Array.isArray(body.short)).toBe(true);
    expect(body.short.length).toBeGreaterThanOrEqual(3);
    expect(typeof body.long).toBe("string");
    expect(body.long.length).toBeGreaterThan(0);
  });

  it("POST /suggest handles different tones", async () => {
    const tones = ["polite", "direct", "funny"] as const;

    for (const tone of tones) {
      const res = await fetch(`${baseUrl}/suggest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Can we reschedule?", tone })
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.short).toBeDefined();
      expect(body.long).toBeDefined();
    }
  });

  it("POST /suggest validates request schema", async () => {
    // Missing text
    const res1 = await fetch(`${baseUrl}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tone: "polite" })
    });

    expect(res1.status).toBe(400);

    // Invalid tone
    const res2 = await fetch(`${baseUrl}/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello", tone: "invalid" })
    });

    expect(res2.status).toBe(400);
  });
});