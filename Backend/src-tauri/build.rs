fn main() {
    println!("cargo:rustc-check-cfg=cfg(mobile)");
    println!("cargo:rerun-if-changed=src");
    println!("cargo:rerun-if-changed=build.rs");

    // Icon generation is handled by tauri-cli
    // Just ensure the icons directory exists
    let _ = std::fs::create_dir_all("icons");

    tauri_build::build();
}

// Fallback icon generation removed - icons/icon.png should be present
// For proper icon generation, use: tauri icon --input icons/icon.png
