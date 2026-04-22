use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
