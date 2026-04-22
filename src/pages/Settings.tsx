import { useState, useEffect } from "react";

const MODELS = [
  { value: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B (Free)" },
  { value: "google/gemma-2-9b-it:free", label: "Gemma 2 9B (Free)" },
  { value: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (Free)" },
];

export default function Settings() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(MODELS[0].value);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    setApiKey(localStorage.getItem("openclaw-api-key") ?? "");
    setModel(localStorage.getItem("openclaw-model") ?? MODELS[0].value);
  }, []);

  function save() {
    localStorage.setItem("openclaw-api-key", apiKey);
    localStorage.setItem("openclaw-model", model);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  function clearChat() {
    localStorage.removeItem("openclaw-chat");
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your OpenClaw experience</p>
      </div>

      <div className="settings-body">
        <section className="settings-section">
          <h2 className="section-title">🤖 AI Configuration</h2>

          <div className="setting-row">
            <label className="setting-label">OpenRouter API Key</label>
            <p className="setting-hint">
              Used to access AI models. Get yours free at openrouter.ai
            </p>
            <div className="key-input-wrapper">
              <input
                type={showKey ? "text" : "password"}
                className="setting-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-or-..."
              />
              <button
                className="show-key-btn"
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide API key" : "Show API key"}
              >
                {showKey ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <div className="setting-row">
            <label className="setting-label">Default Model</label>
            <p className="setting-hint">The AI model used for your conversations</p>
            <select
              className="setting-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">🔧 Workspace</h2>
          <div className="setting-row">
            <label className="setting-label">Gateway URL</label>
            <p className="setting-hint">The local gateway server address (read-only)</p>
            <input
              type="text"
              className="setting-input readonly"
              value="http://localhost:18789"
              readOnly
            />
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">🧹 Data</h2>
          <div className="setting-row">
            <label className="setting-label">Chat History</label>
            <p className="setting-hint">Clear all saved messages from your chat</p>
            <button className="danger-btn" onClick={clearChat}>
              Clear Chat History
            </button>
          </div>
        </section>

        <section className="settings-section about-section">
          <h2 className="section-title">ℹ️ About</h2>
          <div className="about-grid">
            <div className="about-item">
              <span className="about-label">App</span>
              <span className="about-value">OpenClaw Desktop</span>
            </div>
            <div className="about-item">
              <span className="about-label">Version</span>
              <span className="about-value">0.1.0</span>
            </div>
            <div className="about-item">
              <span className="about-label">Built with</span>
              <span className="about-value">Tauri v2 + React + TypeScript</span>
            </div>
          </div>
        </section>

        <button className="save-btn" onClick={save}>
          Save Settings ✓
        </button>
      </div>

      {toast && <div className="toast">Settings saved! 🎉</div>}
    </div>
  );
}
