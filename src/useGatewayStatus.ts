import { useState, useEffect, useCallback } from "react";

export type GatewayStatus = "checking" | "up" | "down";

const GATEWAY_URL = "http://localhost:18789";
const POLL_INTERVAL_UP = 10_000;
const POLL_INTERVAL_DOWN = 2_000;

export function useGatewayStatus() {
  const [status, setStatus] = useState<GatewayStatus>("checking");

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/`, {
        signal: AbortSignal.timeout(3000),
        mode: "no-cors", // gateway may not send CORS headers
      });
      // no-cors gives opaque response — if no throw, it's reachable
      void res;
      setStatus("up");
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
