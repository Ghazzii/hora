import { spawnSync } from "node:child_process";

const executable = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(executable, ["prisma", ...process.argv.slice(2)], {
  env: { ...process.env, RUST_LOG: "info" },
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
