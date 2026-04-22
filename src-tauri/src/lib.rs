use tauri::{Emitter, Manager};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn check_openclaw_installed() -> bool {
    // Mac/Linux common paths
    if std::path::Path::new("/opt/homebrew/bin/openclaw").exists()
        || std::path::Path::new("/usr/local/bin/openclaw").exists()
    {
        return true;
    }
    // Check via which/where
    let cmd = if cfg!(windows) { "where" } else { "which" };
    std::process::Command::new(cmd)
        .arg("openclaw")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
fn install_openclaw(window: tauri::WebviewWindow) {
    std::thread::spawn(move || {
        let os = std::env::consts::OS;

        let success = if os == "windows" {
            // Windows: run the official PowerShell installer
            std::process::Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy", "Bypass",
                    "-Command",
                    "iwr -useb https://openclaw.ai/install.ps1 | iex"
                ])
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        } else {
            // macOS / Linux: run the official shell installer
            std::process::Command::new("bash")
                .args([
                    "-c",
                    "curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard"
                ])
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        };

        if success {
            window.emit("install-progress", "done").ok();
        } else {
            window.emit("install-progress", "error").ok();
        }
    });
}

#[tauri::command]
fn check_openclaw_configured() -> bool {
    let home = std::env::var("HOME").unwrap_or_default();
    let config = format!("{}/.openclaw/openclaw.json", home);
    if !std::path::Path::new(&config).exists() {
        return false;
    }
    std::fs::read_to_string(&config)
        .map(|s| {
            // Configured if any provider OR channel exists
            s.contains("\"providers\"")
                || s.contains("\"openrouter\"")
                || s.contains("\"github-copilot\"")
                || s.contains("\"anthropic\"")
                || s.contains("\"channels\"")
                || s.contains("\"telegram\"")
                || s.contains("\"slack\"")
                || s.contains("\"whatsapp\"")
        })
        .unwrap_or(false)
}

#[tauri::command]
fn save_openrouter_key(key: String) -> bool {
    std::process::Command::new("openclaw")
        .args(["config", "set", "providers.openrouter.apiKey", &key])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
fn init_openclaw_workspace() -> bool {
    let home = std::env::var("HOME").unwrap_or_default();
    let workspace = format!("{}/.openclaw", home);
    std::fs::create_dir_all(&workspace).is_ok()
}

#[tauri::command]
fn get_channels() -> String {
    // Read openclaw.json directly — instant, no subprocess overhead
    let home = std::env::var("HOME").unwrap_or_default();
    let config_path = format!("{}/.openclaw/openclaw.json", home);
    match std::fs::read_to_string(&config_path) {
        Ok(contents) => contents,
        Err(_) => "{}".to_string(),
    }
}

#[tauri::command]
fn get_config() -> String {
    let home = std::env::var("HOME").unwrap_or_default();
    let config_path = format!("{}/.openclaw/openclaw.json", home);
    std::fs::read_to_string(&config_path).unwrap_or_else(|_| "{}".to_string())
}

fn is_gateway_running(port: u16) -> bool {
    std::net::TcpStream::connect(format!("127.0.0.1:{}", port))
        .map(|_| true)
        .unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_channels,
            get_config,
            check_openclaw_installed,
            get_platform,
            install_openclaw,
            check_openclaw_configured,
            save_openrouter_key,
            init_openclaw_workspace
        ])
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let shell = app.shell();

            if is_gateway_running(18789) {
                println!("[openclaw] gateway already running on port 18789, skipping sidecar");
            } else {
                // Spawn the openclaw gateway sidecar.
                // Tauri resolves "binaries/openclaw" → binaries/openclaw-<triple> at runtime.
                match shell
                    .sidecar("binaries/openclaw")
                    .expect("failed to create openclaw sidecar command")
                    .args(["gateway", "run"])
                    .spawn()
                {
                    Ok((_rx, _child)) => {
                        println!("[openclaw] gateway sidecar started");
                    }
                    Err(e) => {
                        eprintln!("[openclaw] failed to start gateway sidecar: {e}");
                        eprintln!("[openclaw] the app will still launch — check that openclaw is installed");
                    }
                }
            }

            // Open devtools in debug builds
            #[cfg(debug_assertions)]
            if let Some(window) = app.get_webview_window("main") {
                window.open_devtools();
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
