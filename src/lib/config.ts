import { invoke } from "@tauri-apps/api/core";

interface OpenClawConfig {
  gateway?: {
    auth?: { token?: string };
    port?: number;
  };
  channels?: Record<string, unknown>;
  providers?: Record<string, unknown>;
}

let cached: OpenClawConfig | null = null;

export async function getConfig(): Promise<OpenClawConfig> {
  if (cached) return cached;
  try {
    const raw = await invoke<string>("get_config");
    cached = JSON.parse(raw) as OpenClawConfig;
  } catch {
    cached = {};
  }
  return cached;
}

export async function getGatewayToken(): Promise<string> {
  const cfg = await getConfig();
  return cfg.gateway?.auth?.token ?? "";
}

export async function getGatewayUrl(): Promise<string> {
  const cfg = await getConfig();
  const port = cfg.gateway?.port ?? 18789;
  return `http://localhost:${port}`;
}
