import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AppDef {
  id: string;
  name: string;
  icon: React.ReactNode;
  instructions: string[] | null;
}

// Telegram SVG icon
function TelegramIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#29B6F6" />
      <path
        d="M5.13 11.65l3.55 1.33 1.37 4.41c.09.27.42.36.63.18l1.98-1.62a.5.5 0 0 1 .61-.02l3.57 2.59c.23.17.56.04.62-.24l2.5-11.5c.07-.3-.21-.57-.5-.46L5.13 10.7c-.3.12-.3.52 0 .65z"
        fill="white"
      />
    </svg>
  );
}

// WhatsApp SVG icon
function WhatsAppIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#25D366" />
      <path
        d="M17.47 6.53A7.26 7.26 0 0 0 12 4.27a7.27 7.27 0 0 0-6.3 10.87L4.27 19.5l4.45-1.41A7.28 7.28 0 0 0 19.27 12a7.27 7.27 0 0 0-1.8-5.47zm-5.47 11.2a6.04 6.04 0 0 1-3.08-.84l-.22-.13-2.64.84.72-2.57-.14-.23a6.05 6.05 0 1 1 5.36 2.93zm3.32-4.52c-.18-.09-1.07-.53-1.23-.59-.17-.06-.29-.09-.41.09-.12.18-.47.59-.58.71-.11.12-.21.13-.39.04a4.9 4.9 0 0 1-1.44-.89 5.4 5.4 0 0 1-1-1.24c-.1-.18-.01-.28.08-.37.08-.08.18-.21.27-.32.09-.11.12-.18.18-.3.06-.12.03-.22-.01-.31-.05-.09-.41-1-.56-1.37-.15-.36-.3-.31-.41-.31h-.35c-.12 0-.31.04-.47.22-.16.18-.62.6-.62 1.47s.63 1.7.72 1.82c.09.12 1.24 1.9 3 2.65.42.18.75.29 1 .37.42.13.8.11 1.1.07.34-.05 1.04-.43 1.19-.84.14-.41.14-.76.1-.84-.04-.08-.16-.13-.34-.22z"
        fill="white"
      />
    </svg>
  );
}

const APPS: AppDef[] = [
  {
    id: "telegram",
    name: "Telegram",
    icon: <TelegramIcon />,
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
    icon: <WhatsAppIcon />,
    instructions: null,
  },
  {
    id: "signal",
    name: "Signal",
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#3A76F0" />
        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">S</text>
      </svg>
    ),
    instructions: null,
  },
  {
    id: "discord",
    name: "Discord",
    icon: (
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="12" fill="#5865F2" />
        <text x="12" y="17" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">D</text>
      </svg>
    ),
    instructions: null,
  },
];

export default function ConnectedApps() {
  const [telegramConnected, setTelegramConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalApp, setModalApp] = useState<AppDef | null>(null);

  const checkTelegramStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await invoke<string>("get_channels");
      const data = JSON.parse(result) as Record<string, unknown>;
      // openclaw.json has channels at top level e.g. data.channels.telegram or data.telegram
      const ch = (data?.channels ?? data) as Record<string, unknown>;
      const hasTelegram = ch?.telegram != null;
      setTelegramConnected(hasTelegram);
    } catch {
      setTelegramConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkTelegramStatus();
  }, [checkTelegramStatus]);

  function getStatus(appId: string): boolean | null {
    if (appId === "telegram") return telegramConnected;
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connected Apps</h1>
          <p className="text-sm text-gray-500 mt-1">
            Link your favourite messaging apps to chat with OpenClaw anywhere
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={checkTelegramStatus}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {APPS.map((app) => {
          const status = getStatus(app.id);
          const comingSoon = app.instructions === null;
          const connected = status === true;

          return (
            <Card key={app.id} className="relative">
              <CardContent className="pt-5 pb-5 px-5">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">{app.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm mb-1.5">{app.name}</div>
                    {comingSoon ? (
                      <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                    ) : connected ? (
                      <Badge variant="success" className="text-xs">Connected</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-gray-500">Not connected</Badge>
                    )}
                  </div>
                </div>
                {!comingSoon && (
                  <Button
                    variant={connected ? "outline" : "default"}
                    size="sm"
                    className={`w-full mt-4 text-xs ${!connected ? "bg-orange-600 hover:bg-orange-700 text-white" : ""}`}
                    onClick={() => setModalApp(app)}
                  >
                    {connected ? "Manage" : "Connect"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal */}
      {modalApp && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModalApp(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              {modalApp.icon}
              <div>
                <div className="font-bold text-gray-900">Connect {modalApp.name}</div>
                <div className="text-sm text-gray-500">Follow these steps to get started</div>
              </div>
              <button
                className="ml-auto text-gray-400 hover:text-gray-600 text-xl leading-none"
                onClick={() => setModalApp(null)}
              >
                ✕
              </button>
            </div>
            <ol className="space-y-3 mb-6">
              {modalApp.instructions?.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => setModalApp(null)}
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
