import { useState, useEffect } from "react";
import { Eye, EyeOff, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const DEFAULT_TOKEN = "REDACTED_TOKEN";

export default function Settings() {
  const [gatewayToken, setGatewayToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setGatewayToken(localStorage.getItem("openclaw-gateway-token") ?? "");
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function save() {
    if (gatewayToken.trim()) {
      localStorage.setItem("openclaw-gateway-token", gatewayToken.trim());
    } else {
      localStorage.removeItem("openclaw-gateway-token");
    }
    showToast("Settings saved!");
  }

  function clearChat() {
    localStorage.removeItem("openclaw-chat");
    showToast("Chat history cleared!");
  }

  function resetToken() {
    setGatewayToken("");
    localStorage.removeItem("openclaw-gateway-token");
    showToast("Token reset to default");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Customize your OpenClaw experience</p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gateway Configuration</CardTitle>
            <CardDescription>Override the default gateway connection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Gateway URL
              </label>
              <Input value="http://localhost:18789" readOnly className="bg-gray-50 text-gray-500" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Bearer Token
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Leave blank to use the default token. Only change if you have a custom token.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showToken ? "text" : "password"}
                    value={gatewayToken}
                    onChange={(e) => setGatewayToken(e.target.value)}
                    placeholder={DEFAULT_TOKEN.slice(0, 8) + "…"}
                    className="pr-10"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowToken(!showToken)}
                    type="button"
                  >
                    {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {gatewayToken && (
                  <Button variant="outline" size="sm" onClick={resetToken} className="shrink-0">
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Data & Privacy</CardTitle>
            <CardDescription>Manage your locally stored data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Chat History</div>
                <div className="text-xs text-gray-500 mt-0.5">Clear all saved messages from your chat</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-red-600 border-red-200 hover:bg-red-50 gap-2"
              >
                <Trash2 size={14} />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">About</div>
            <Separator className="mb-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">App</span>
                <span className="font-medium text-gray-800">OpenClaw Desktop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="font-medium text-gray-800">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Built with</span>
                <span className="font-medium text-gray-800">Tauri v2 + React + TypeScript</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={save}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          size="lg"
        >
          <Save size={16} />
          Save Settings
        </Button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
