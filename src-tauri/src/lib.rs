use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
fn check_openclaw_installed() -> bool {
    std::path::Path::new("/opt/homebrew/bin/openclaw").exists()
        || std::process::Command::new("which")
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
fn install_openclaw_mac(window: tauri::WebviewWindow) {
    std::thread::spawn(move || {
        let brew = if std::path::Path::new("/opt/homebrew/bin/brew").exists() {
            "/opt/homebrew/bin/brew"
        } else {
            "brew"
        };

        let status = std::process::Command::new(brew)
            .args(["install", "openclaw"])
            .status();

        match status {
            Ok(s) if s.success() => {
                window.emit("install-progress", "done").ok();
            }
            _ => {
                window.emit("install-progress", "error").ok();
            }
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
            s.contains("\"providers\"")
                || s.contains("\"openrouter\"")
                || s.contains("\"github-copilot\"")
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_channels,
            check_openclaw_installed,
            get_platform,
            install_openclaw_mac,
            check_openclaw_configured,
            save_openrouter_key,
            init_openclaw_workspace
        ])
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let shell = app.shell();

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
