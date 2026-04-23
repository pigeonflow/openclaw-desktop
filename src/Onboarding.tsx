import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, Check } from "lucide-react";

type Step = "checking" | "installing" | "provider" | "done";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("checking");
  const [platform, setPlatform] = useState<string>("macos");
  const [installError, setInstallError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function runCheck() {
      const plt = await invoke<string>("get_platform").catch(() => "macos");
      setPlatform(plt);

      const installed = await invoke<boolean>("check_openclaw_installed").catch(
        () => false
      );
      if (!installed) {
        setStep("installing");
        startInstall();
        return;
      }

      const configured = await invoke<boolean>(
        "check_openclaw_configured"
      ).catch(() => false);
      if (!configured) {
        setStep("provider");
        return;
      }

      setStep("done");
      setTimeout(onComplete, 1500);
    }
    runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startInstall() {
    setProgress(5);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 85) {
          clearInterval(progressTimerRef.current!);
          return 85;
        }
        return p + Math.random() * 8;
      });
    }, 1200);

    const unlisten = await listen<string>("install-progress", async (event) => {
      unlisten();
      clearInterval(progressTimerRef.current!);

      if (event.payload === "done") {
        setProgress(100);
        await new Promise((r) => setTimeout(r, 600));
        setStep("provider");
      } else {
        setInstallError(true);
        setProgress(0);
      }
    });

    invoke("install_openclaw").catch(() => {
      setInstallError(true);
      setProgress(0);
    });
  }

  function handleSkip() {
    setStep("done");
    setTimeout(onComplete, 1500);
  }

  function handleProviderDone() {
    setStep("done");
    setTimeout(onComplete, 1500);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {step === "checking" && <CheckingStep />}
      {step === "installing" && (
        <InstallingStep
          platform={platform}
          progress={progress}
          error={installError}
          copied={copied}
          onCopy={copyText}
          onSkip={handleSkip}
        />
      )}
      {step === "provider" && (
        <ProviderStep onComplete={handleProviderDone} onSkip={handleSkip} />
      )}
      {step === "done" && <DoneStep />}
    </div>
  );
}

function CheckingStep() {
  return (
    <Card className="w-full max-w-md text-center shadow-lg border-0">
      <CardContent className="pt-10 pb-10">
        <div className="text-6xl mb-4">🦞</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Setting up OpenClaw…
        </h2>
        <p className="text-sm text-gray-500">
          Checking your system, just a moment.
        </p>
        <div className="flex justify-center gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InstallingStep({
  platform,
  progress,
  error,
  copied,
  onCopy,
  onSkip,
}: {
  platform: string;
  progress: number;
  error: boolean;
  copied: boolean;
  onCopy: (cmd: string) => void;
  onSkip: () => void;
}) {
  const manualCmd =
    platform === "windows"
      ? "iwr -useb https://openclaw.ai/install.ps1 | iex"
      : "curl -fsSL https://openclaw.ai/install.sh | bash";

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="text-5xl mb-2">🦞</div>
        <CardTitle className="text-xl">
          {error ? "Installation failed" : "Installing OpenClaw…"}
        </CardTitle>
        <CardDescription>
          {error
            ? "The automatic install did not complete. Open a terminal and run:"
            : "Running the official installer, this takes about a minute."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!error && <Progress value={progress} className="h-2" />}
        {error && (
          <>
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-sm flex items-center justify-between gap-2">
              <span className="truncate">{manualCmd}</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white h-7 px-2 shrink-0"
                onClick={() => onCopy(manualCmd)}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full text-gray-400 text-sm"
              onClick={onSkip}
            >
              I've installed it manually — continue
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type ActiveProvider = "openai-codex" | "anthropic" | "github-copilot" | "openrouter" | null;

const KEY_URL = "https://openrouter.ai/keys";

function ProviderStep({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [active, setActive] = useState<ActiveProvider>(null);
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [authWaiting, setAuthWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function selectProvider(provider: ActiveProvider) {
    setError(null);

    if (provider === "openrouter") {
      setActive("openrouter");
      setKey("");
      openUrl(KEY_URL);
      return;
    }

    // All other providers use openclaw models auth login --provider <id>
    setActive(provider);
    setAuthWaiting(true);
    const unlisten = await listen<string>("auth-progress", (event) => {
      unlisten();
      setAuthWaiting(false);
      if (event.payload === "done") {
        onComplete();
      } else {
        setError("Authentication failed. Check that openclaw is installed and try again.");
        setActive(null);
      }
    });
    invoke("auth_provider", { provider }).catch(() => {
      unlisten();
      setAuthWaiting(false);
      setError("Could not start authentication. Is openclaw installed?");
      setActive(null);
    });
  }

  async function saveKey() {
    if (!key.trim()) return;
    setSaving(true);
    setError(null);
    await invoke("init_openclaw_workspace").catch(() => {});
    const ok = await invoke<boolean>("save_provider_key", {
      provider: "openrouter",
      key: key.trim(),
    }).catch(() => false);
    setSaving(false);
    if (ok) {
      onComplete();
    } else {
      setError("Failed to save key. Is openclaw installed?");
    }
  }

  const mainProviders: { id: ActiveProvider; label: string; icon: string; sub: string }[] = [
    { id: "openai-codex", label: "OpenAI", icon: "🤖", sub: "ChatGPT subscription" },
    { id: "anthropic", label: "Claude", icon: "🪬", sub: "Anthropic Claude" },
    { id: "github-copilot", label: "GitHub Copilot", icon: "🐙", sub: "Sign in with GitHub" },
  ];

  const freeProviders: { id: ActiveProvider; label: string; sub: string }[] = [
    { id: "openrouter", label: "OpenRouter", sub: "Free models — no credit card" },
    { id: "github-copilot", label: "GitHub Copilot", sub: "Free tier available" },
  ];

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-4">
        <div className="text-5xl mb-2">🦞</div>
        <CardTitle className="text-xl">Connect your AI brain</CardTitle>
        <CardDescription>Choose a provider to power OpenClaw.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main provider grid */}
        <div className="grid grid-cols-3 gap-2">
          {mainProviders.map((p) => (
            <button
              key={p.id}
              onClick={() => selectProvider(p.id)}
              disabled={authWaiting}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center transition-all ${
                active === p.id
                  ? "border-orange-400 bg-orange-50 ring-1 ring-orange-300"
                  : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
              }`}
            >
              <span className="text-2xl">{p.icon}</span>
              <span className="text-xs font-semibold text-gray-800">{p.label}</span>
              <span className="text-[10px] text-gray-400 leading-tight">{p.sub}</span>
            </button>
          ))}
        </div>

        {/* Auth waiting indicator */}
        {authWaiting && active && (
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3">
            <div className="h-4 w-4 rounded-full border-2 border-orange-400 border-t-transparent animate-spin shrink-0" />
            <p className="text-sm text-orange-700">
              Follow the prompts in the terminal window that opened…
            </p>
          </div>
        )}

        {/* OpenRouter key paste */}
        {active === "openrouter" && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">OpenRouter API key</label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk-or-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveKey()}
                className="font-mono"
                autoFocus
              />
              <Button
                onClick={saveKey}
                disabled={!key.trim() || saving}
                className="bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                {saving ? "…" : "Save"}
              </Button>
            </div>
            <p className="text-[11px] text-gray-400">
              Your OpenRouter key page was opened — paste it above.
            </p>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Free tier section */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400">
            ✨ New to this? Start for free:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {freeProviders.map((p) => (
              <button
                key={p.id + "-free"}
                onClick={() => selectProvider(p.id)}
                disabled={authWaiting}
                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left transition-all ${
                  active === p.id
                    ? "border-orange-400 bg-orange-50"
                    : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
                }`}
              >
                <span className="text-xs font-semibold text-gray-700">{p.label}</span>
                <span className="text-[10px] text-gray-400">{p.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          onClick={onSkip}
        >
          Skip — I'll configure this later
        </button>
      </CardContent>
    </Card>
  );
}

function DoneStep() {
  return (
    <Card className="w-full max-w-md text-center shadow-lg border-0">
      <CardContent className="pt-10 pb-10">
        <div className="text-6xl mb-4 animate-bounce">🦞</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          You're all set! 🎉
        </h2>
        <p className="text-sm text-gray-500">
          OpenClaw is ready. Taking you to the app…
        </p>
      </CardContent>
    </Card>
  );
}
