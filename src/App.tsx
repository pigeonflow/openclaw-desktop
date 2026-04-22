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
      <div className="logo">OpenClaw</div>
      <div className="dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <div className="message">Starting gateway&hellip;</div>
    </div>
  );
}

// --- Placeholder Page ---
function PlaceholderPage({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="placeholder-page">
      <div className="page-icon">{icon}</div>
      <div className="page-title">{title}</div>
      <div className="page-desc">{desc}</div>
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
        : "Checking gateway…";
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

  // Show loading screen until gateway is up or 8 seconds pass
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
        return (
          <PlaceholderPage
            icon="💬"
            title="Chat"
            desc="AI chat interface — coming in Phase 2"
          />
        );
      case "apps":
        return (
          <PlaceholderPage
            icon="🔌"
            title="Connected Apps"
            desc="Manage your connected integrations — coming in Phase 2"
          />
        );
      case "skills":
        return (
          <PlaceholderPage
            icon="⭐"
            title="Skills"
            desc="Browse and manage AI skills — coming in Phase 2"
          />
        );
      case "developer":
        return <DeveloperPage gatewayUp={gatewayStatus === "up"} />;
      case "settings":
        return (
          <PlaceholderPage
            icon="⚙️"
            title="Settings"
            desc="App and gateway settings — coming in Phase 2"
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">OpenClaw</div>
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
