use tauri::Emitter;

fn find_openclaw() -> Option<String> {
    // Well-known install paths (Mac/Linux)
    let candidates = [
        "/opt/homebrew/bin/openclaw",
        "/usr/local/bin/openclaw",
        "/usr/bin/openclaw",
    ];
    for path in &candidates {
        if std::path::Path::new(path).exists() {
            return Some(path.to_string());
        }
    }
    // Home-local bin (~/.local/bin/openclaw)
    if let Ok(home) = std::env::var("HOME") {
        let p = format!("{}/.local/bin/openclaw", home);
        if std::path::Path::new(&p).exists() {
            return Some(p);
        }
    }
    // Windows: %LOCALAPPDATA%\Programs\openclaw\openclaw.exe
    #[cfg(windows)]
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        let p = format!(r"{}\Programs\openclaw\openclaw.exe", local);
        if std::path::Path::new(&p).exists() {
            return Some(p);
        }
    }
    // Fall back to PATH
    let which_cmd = if cfg!(windows) { "where" } else { "which" };
    std::process::Command::new(which_cmd)
        .arg("openclaw")
        .output()
        .ok()
        .filter(|o| o.status.success())
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.lines().next().unwrap_or("").trim().to_string())
        .filter(|s| !s.is_empty())
}

#[tauri::command]
fn check_openclaw_installed() -> bool {
    find_openclaw().is_some()
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
            // Windows: download installer to a temp file, then execute it as a file.
            // Avoids the iwr|iex inline-execution pattern that AV heuristics flag.
            std::process::Command::new("powershell")
                .args([
                    "-NoProfile",
                    "-NonInteractive",
                    "-ExecutionPolicy", "Bypass",
                    "-Command",
                    r"$t=[IO.Path]::Combine([IO.Path]::GetTempPath(),'oc_install.ps1'); Invoke-WebRequest -Uri 'https://openclaw.ai/install.ps1' -OutFile $t; & $t --non-interactive; Remove-Item $t -ErrorAction SilentlyContinue"
                ])
                .status()
                .map(|s| s.success())
                .unwrap_or(false)
        } else {
            // macOS / Linux: run the official shell installer
            std::process::Command::new("bash")
                .args([
                    "-c",
                    "curl -fsSL https://openclaw.ai/install.sh | bash -s -- --non-interactive"
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
                || s.contains("\"openai\"")
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
fn save_provider_key(provider: String, key: String) -> bool {
    let openclaw = match find_openclaw() {
        Some(p) => p,
        None => return false,
    };
    let config_key = format!("providers.{}.apiKey", provider);
    std::process::Command::new(openclaw)
        .args(["config", "set", &config_key, &key])
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
fn auth_provider(provider: String, window: tauri::WebviewWindow) {
    std::thread::spawn(move || {
        let openclaw = match find_openclaw() {
            Some(p) => p,
            None => {
                window.emit("auth-progress", "error").ok();
                return;
            }
        };
        let success = std::process::Command::new(&openclaw)
            .args(["models", "auth", "login", "--provider", &provider])
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
        if success {
            window.emit("auth-progress", "done").ok();
        } else {
            window.emit("auth-progress", "error").ok();
        }
    });
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
            save_provider_key,
            auth_provider,
            init_openclaw_workspace
        ])
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if is_gateway_running(18789) {
                println!("[openclaw] gateway already running on port 18789, skipping");
            } else if let Some(openclaw) = find_openclaw() {
                match std::process::Command::new(&openclaw)
                    .args(["gateway", "run"])
                    .spawn()
                {
                    Ok(_) => println!("[openclaw] gateway started via {}", openclaw),
                    Err(e) => eprintln!("[openclaw] failed to start gateway: {e}"),
                }
            } else {
                println!("[openclaw] not installed yet — onboarding will handle installation");
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
