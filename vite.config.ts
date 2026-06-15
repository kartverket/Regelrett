import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export default () => {
  const regelrettRoot = path.join(currentDir);
  const defaultSettings = readFileSync(`${regelrettRoot}/conf/defaults.yaml`, {
    encoding: "utf-8",
  });

  const customSettings = existsSync(`${regelrettRoot}/conf/custom.yaml`)
    ? readFileSync(`${regelrettRoot}/conf/custom.yaml`, {
        encoding: "utf-8",
      })
    : "";

  const defaults = parse(defaultSettings);
  const custom = parse(customSettings);

  const merged = {
    ...defaults.frontend_dev_server,
    ...custom?.frontend_dev_server,
  };

  const env: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(merged)) {
    env[`RR_FRONTEND_DEV_SERVER_${key.toUpperCase()}`] = value;
  }

  for (const [key, _] of Object.entries(env)) {
    const envVal = process.env[`${key}`];
    if (envVal != undefined && envVal != "") {
      env[key] = envVal;
    }
  }

  return defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(currentDir, "./app"),
      },
    },
    server: {
      port: Number(env.RR_FRONTEND_DEV_SERVER_HTTP_PORT),
      host: env.RR_FRONTEND_DEV_SERVER_HOST as string,
      strictPort: true,
    },
    build: {
      manifest: true,
      rollupOptions: {
        input: "./app/main.tsx",
      },
    },
  });
};
