import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-shell";
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
import { ExternalLink, Copy, Check } from "lucide-react";

type Step = "checking" | "installing" | "openrouter" | "done";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("checking");
  const [platform, setPlatform] = useState<string>("macos");
  const [installError, setInstallError] = useState(false);
  const [progress, setProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
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
        if (plt === "macos") {
          startInstall();
        }
        return;
      }

      const configured = await invoke<boolean>(
        "check_openclaw_configured"
      ).catch(() => false);
      if (!configured) {
        setStep("openrouter");
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
        setStep("openrouter");
      } else {
        setInstallError(true);
        setProgress(0);
      }
    });

    invoke("install_openclaw_mac").catch(() => {
      setInstallError(true);
      setProgress(0);
    });
  }

  async function handleSaveKey() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setSaveError(false);

    await invoke("init_openclaw_workspace").catch(() => {});

    const ok = await invoke<boolean>("save_openrouter_key", {
      key: apiKey.trim(),
    }).catch(() => false);
    setSaving(false);

    if (ok) {
      setStep("done");
      setTimeout(onComplete, 2000);
    } else {
      setSaveError(true);
    }
  }

  function handleSkip() {
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
      {step === "openrouter" && (
        <OpenRouterStep
          apiKey={apiKey}
          setApiKey={setApiKey}
          onSave={handleSaveKey}
          onSkip={handleSkip}
          saving={saving}
          error={saveError}
        />
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
    platform === "windows" ? "winget install openclaw" : "brew install openclaw";

  if (platform !== "macos") {
    return (
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center pb-2">
          <div className="text-5xl mb-2">🦞</div>
          <CardTitle className="text-xl">Install OpenClaw</CardTitle>
          <CardDescription>
            Run this command in your terminal to install OpenClaw.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
          <p className="text-xs text-gray-400 text-center">
            After installation, restart OpenClaw Desktop.
          </p>
          <Button
            variant="ghost"
            className="w-full text-gray-400 text-sm"
            onClick={onSkip}
          >
            I've already installed it — skip this step
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-2">
        <div className="text-5xl mb-2">🦞</div>
        <CardTitle className="text-xl">
          {error ? "Installation failed" : "Installing OpenClaw…"}
        </CardTitle>
        <CardDescription>
          {error
            ? "Something went wrong. Please install manually using Homebrew."
            : "Installing via Homebrew, this takes about a minute."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!error && <Progress value={progress} className="h-2" />}
        {error && (
          <>
            <div className="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-sm flex items-center justify-between gap-2">
              <span>brew install openclaw</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white h-7 px-2 shrink-0"
                onClick={() => onCopy("brew install openclaw")}
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

function OpenRouterStep({
  apiKey,
  setApiKey,
  onSave,
  onSkip,
  saving,
  error,
}: {
  apiKey: string;
  setApiKey: (k: string) => void;
  onSave: () => void;
  onSkip: () => void;
  saving: boolean;
  error: boolean;
}) {
  return (
    <Card className="w-full max-w-md shadow-lg border-0">
      <CardHeader className="text-center pb-4">
        <div className="text-5xl mb-2">🦞</div>
        <CardTitle className="text-xl">Connect your AI brain</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          OpenClaw needs an AI provider. OpenRouter offers free models — no
          credit card needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
          onClick={() => open("https://openrouter.ai/keys")}
        >
          <ExternalLink size={14} />
          Get a free API key →
        </Button>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">
            OpenRouter API key
          </label>
          <Input
            type="password"
            placeholder="sk-or-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSave()}
            className="font-mono"
          />
          {error && (
            <p className="text-xs text-red-500">
              Failed to save key. Is openclaw installed and on your PATH?
            </p>
          )}
        </div>

        <Button
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          onClick={onSave}
          disabled={!apiKey.trim() || saving}
        >
          {saving ? "Saving…" : "Continue →"}
        </Button>

        <button
          className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
          onClick={onSkip}
        >
          Skip setup — I'll configure this later
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
