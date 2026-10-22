import { execFileSync, execSync } from "node:child_process";

// Runs npm in a throwaway project for the smoke scripts.
// - On Windows npm is a .cmd shim that can only be started through a shell, so build one quoted command line there.
// - A user-level `allow-scripts` setting (npm 12 reads it from ~/.npmrc) makes every project-scoped install fail
//   with EALLOWSCRIPTS. These installs always use --ignore-scripts, so neutralise the setting for the child process.
export function npm(args, options = {}) {
  const env = { ...process.env, ...options.env, npm_config_allow_scripts: "" };
  const execOptions = { ...options, env };
  return process.platform === "win32"
    ? execSync(["npm", ...args.map((arg) => JSON.stringify(arg))].join(" "), execOptions)
    : execFileSync("npm", args, execOptions);
}
