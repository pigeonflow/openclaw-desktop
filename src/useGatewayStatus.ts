import { useState, useEffect, useCallback } from "react";

export type GatewayStatus = "checking" | "up" | "down";

const POLL_INTERVAL_UP = 10_000;
const POLL_INTERVAL_DOWN = 2_000;

export function useGatewayStatus() {
  const [status, setStatus] = useState<GatewayStatus>("checking");

  const check = useCallback(async () => {
    try {
      const res = await fetch("/gateway/health", {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json() as { ok?: boolean };
        setStatus(data.ok ? "up" : "down");
      } else {
        setStatus("down");
      }
    } catch {
      setStatus("down");
    }
  }, []);

  useEffect(() => {
    check();
    const interval = setInterval(
      check,
      status === "up" ? POLL_INTERVAL_UP : POLL_INTERVAL_DOWN
    );
    return () => clearInterval(interval);
  }, [check, status]);

  return status;
}
