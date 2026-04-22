import { useState, useEffect, useRef } from "react";
import { useGatewayStatus } from "./useGatewayStatus";
import {
  IconChat,
  IconApps,
  IconSkills,
  IconDeveloper,
  IconSettings,
  IconRefresh,
} from "./icons";
import Chat from "./pages/Chat";
import ConnectedApps from "./pages/ConnectedApps";
import Skills from "./pages/Skills";
import Settings from "./pages/Settings";

type NavId = "chat" | "apps" | "skills" | "developer" | "settings";

interface NavItem {
  id: NavId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat", label: "Chat", icon: <IconChat /> },
  { id: "apps", label: "Connected Apps", icon: <IconApps /> },
  { id: "skills", label: "Skills", icon: <IconSkills /> },
  { id: "developer", label: "Developer", icon: <IconDeveloper /> },
  { id: "settings", label: "Settings", icon: <IconSettings /> },
];

const GATEWAY_URL = "http://localhost:18789";

// --- Loading Screen ---
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">
        <span className="logo-claw">🦞</span>
        <span className="logo-text">OpenClaw</span>
      </div>
      <div className="dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <div className="loading-message">Starting up&hellip;</div>
    </div>
  );
}

// --- Developer Page ---
function DeveloperPage({ gatewayUp }: { gatewayUp: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [frameKey, setFrameKey] = useState(0);

  const reload = () => setFrameKey((k) => k + 1);

  return (
    <div className="developer-page">
      <div className="dev-toolbar">
        <div className="url-bar">{GATEWAY_URL}</div>
        <button className="reload-btn" onClick={reload} title="Reload">
          <IconRefresh />
        </button>
      </div>
      {gatewayUp ? (
        <iframe
          key={frameKey}
          ref={iframeRef}
          className="gateway-frame"
          src={GATEWAY_URL}
          title="OpenClaw Gateway UI"
        />
      ) : (
        <div className="gateway-offline">
          <div className="offline-icon">⚡</div>
          <div className="offline-title">Gateway offline</div>
          <div className="offline-desc">
            Waiting for gateway at {GATEWAY_URL}&hellip;
          </div>
        </div>
      )}
    </div>
  );
}

// --- Status Dot ---
function StatusDot({ status }: { status: "up" | "down" | "checking" }) {
  const label =
    status === "up"
      ? "Gateway running"
      : status === "down"
        ? "Gateway offline"
        : "Checking…";
  return (
    <div className="sidebar-footer">
      <div className={`status-dot ${status}`} />
      <span className="status-label">{label}</span>
    </div>
  );
}

// --- App ---
export default function App() {
  const gatewayStatus = useGatewayStatus();
  const [activeNav, setActiveNav] = useState<NavId>("chat");
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (gatewayStatus === "up") {
      setIsInitialLoading(false);
      return;
    }
    const timeout = setTimeout(() => setIsInitialLoading(false), 8000);
    return () => clearTimeout(timeout);
  }, [gatewayStatus]);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  const renderContent = () => {
    switch (activeNav) {
      case "chat":
        return <Chat />;
      case "apps":
        return <ConnectedApps />;
      case "skills":
        return <Skills />;
      case "developer":
        return <DeveloperPage gatewayUp={gatewayStatus === "up"} />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="logo-emoji">🦞</span>
            <span>OpenClaw</span>
          </div>
          <div className="sidebar-subtitle">Desktop v0.1</div>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeNav === item.id ? "active" : ""}`}
              onClick={() => setActiveNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <StatusDot status={gatewayStatus} />
      </nav>
      <main className="main-content">{renderContent()}</main>
    </div>
  );
}
