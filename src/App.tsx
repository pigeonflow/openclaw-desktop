import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-shell";
import { MessageCircle, Plug, Puzzle, Code2, Settings, Circle, ExternalLink } from "lucide-react";
import { useGatewayStatus } from "./useGatewayStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Chat from "./pages/Chat";
import ConnectedApps from "./pages/ConnectedApps";
import Skills from "./pages/Skills";
import SettingsPage from "./pages/Settings";

type NavId = "chat" | "apps" | "skills" | "developer" | "settings";

interface NavItem {
  id: NavId;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "chat", label: "Chat", icon: <MessageCircle size={16} /> },
  { id: "apps", label: "Connected Apps", icon: <Plug size={16} /> },
  { id: "skills", label: "Skills", icon: <Puzzle size={16} /> },
  { id: "developer", label: "Developer", icon: <Code2 size={16} /> },
  { id: "settings", label: "Settings", icon: <Settings size={16} /> },
];

const GATEWAY_URL = "http://localhost:18789";
const GATEWAY_TOKEN = "REDACTED_TOKEN";

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
      <div className="loading-message">Starting up…</div>
    </div>
  );
}

function DeveloperPage({ gatewayUp }: { gatewayUp: boolean }) {
  const [copied, setCopied] = useState(false);

  async function openGateway() {
    try {
      await navigator.clipboard.writeText(GATEWAY_TOKEN);
      setCopied(true);
      setTimeout(() => setCopied(false), 4000);
    } catch {
      // clipboard not available, proceed anyway
    }
    open(GATEWAY_URL).catch(() => window.open(GATEWAY_URL));
  }

  const tokenMasked = GATEWAY_TOKEN.slice(0, 8) + "…" + GATEWAY_TOKEN.slice(-6);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Developer</h1>
        <p className="text-sm text-gray-500 mt-1">Gateway connection details and diagnostic tools</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Gateway Status</CardTitle>
              <Badge variant={gatewayUp ? "success" : "destructive"}>
                {gatewayUp ? "Online" : "Offline"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">URL</span>
              <span className="text-sm font-mono text-gray-800">{GATEWAY_URL}</span>
            </div>
            <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Health endpoint</span>
              <span className="text-sm font-mono text-gray-500">GET /health</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <span className="text-sm font-medium text-gray-600">Token</span>
              <span className="text-sm font-mono text-gray-500">{tokenMasked}</span>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={openGateway}
          disabled={!gatewayUp}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          size="lg"
        >
          <ExternalLink size={16} />
          Copy token &amp; open dashboard
        </Button>

        {copied && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <CardDescription className="text-emerald-700 text-center">
                Your token has been copied — paste it when prompted by the dashboard.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {!gatewayUp && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4 pb-4">
              <CardDescription className="text-amber-700 text-center">
                Gateway is offline. Waiting for it to start at {GATEWAY_URL}…
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "up" | "down" | "checking" }) {
  const label =
    status === "up" ? "Gateway running" :
    status === "down" ? "Gateway offline" :
    "Checking…";
  const color =
    status === "up" ? "text-emerald-500" :
    status === "down" ? "text-red-400" :
    "text-amber-400";

  return (
    <div className="sidebar-footer">
      <Circle size={8} className={`${color} fill-current`} />
      <span className="status-label">{label}</span>
    </div>
  );
}

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
      case "chat": return <Chat />;
      case "apps": return <ConnectedApps />;
      case "skills": return <Skills />;
      case "developer": return <DeveloperPage gatewayUp={gatewayStatus === "up"} />;
      case "settings": return <SettingsPage />;
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
