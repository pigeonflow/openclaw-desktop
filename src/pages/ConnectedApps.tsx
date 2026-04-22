import { useState, useEffect } from "react";

interface AppDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  instructions: string[] | null;
}

const APPS: AppDef[] = [
  {
    id: "telegram",
    name: "Telegram",
    emoji: "✈️",
    color: "#0088cc",
    bgColor: "#e8f4fd",
    instructions: [
      "Open the Telegram app on your phone or desktop",
      "Search for your OpenClaw bot by name",
      'Tap on the bot and press "Start"',
      "Send /start to begin chatting with your assistant",
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    emoji: "💬",
    color: "#25d366",
    bgColor: "#e8fdf2",
    instructions: null,
  },
  {
    id: "signal",
    name: "Signal",
    emoji: "🔒",
    color: "#3a76f0",
    bgColor: "#edf2ff",
    instructions: null,
  },
  {
    id: "discord",
    name: "Discord",
    emoji: "🎮",
    color: "#5865f2",
    bgColor: "#eef0ff",
    instructions: null,
  },
];

export default function ConnectedApps() {
  const [channelStatus, setChannelStatus] = useState<Record<string, boolean>>({});
  const [modalApp, setModalApp] = useState<AppDef | null>(null);

  useEffect(() => {
    fetch("http://localhost:18789/api/v1/channels")
      .then((r) => r.json())
      .then((data: { channels?: { name: string; connected?: boolean; enabled?: boolean }[] }) => {
        const map: Record<string, boolean> = {};
        (data.channels ?? []).forEach((ch) => {
          map[ch.name.toLowerCase()] = ch.connected ?? ch.enabled ?? false;
        });
        setChannelStatus(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="apps-page">
      <div className="page-header">
        <h1 className="page-title">Connected Apps</h1>
        <p className="page-subtitle">
          Link your favourite messaging apps to chat with OpenClaw anywhere
        </p>
      </div>

      <div className="apps-grid">
        {APPS.map((app) => {
          const connected = channelStatus[app.id] ?? false;
          const comingSoon = app.instructions === null;
          return (
            <div key={app.id} className="app-card">
              <div
                className="app-card-icon"
                style={{ background: app.bgColor, color: app.color }}
              >
                {app.emoji}
              </div>
              <div className="app-card-body">
                <div className="app-card-name">{app.name}</div>
                <div
                  className={`app-badge ${
                    comingSoon
                      ? "badge-soon"
                      : connected
                        ? "badge-connected"
                        : "badge-disconnected"
                  }`}
                >
                  {comingSoon ? "Coming soon" : connected ? "✓ Connected" : "Not connected"}
                </div>
              </div>
              {!comingSoon && (
                <button
                  className={`app-connect-btn ${connected ? "btn-manage" : "btn-connect"}`}
                  onClick={() => setModalApp(app)}
                >
                  {connected ? "Manage" : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {modalApp && (
        <div className="modal-overlay" onClick={() => setModalApp(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div
                className="modal-icon"
                style={{ background: modalApp.bgColor, color: modalApp.color }}
              >
                {modalApp.emoji}
              </div>
              <div className="modal-header-text">
                <div className="modal-title">Connect {modalApp.name}</div>
                <div className="modal-subtitle">Follow these easy steps to get started</div>
              </div>
              <button className="modal-close" onClick={() => setModalApp(null)}>
                ✕
              </button>
            </div>
            <ol className="modal-steps">
              {modalApp.instructions?.map((step, i) => (
                <li key={i} className="modal-step">
                  <span
                    className="step-num"
                    style={{ background: modalApp.bgColor, color: modalApp.color }}
                  >
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <button className="modal-done" onClick={() => setModalApp(null)}>
              Got it! 👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
