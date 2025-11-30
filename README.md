# 🖼️ Album

**Your desktop, reimagined.**

![Preview](./preview.png)

Album is a lightweight digital photo frame that does more than just look pretty. Built with **Tauri v2**, it turns your screen into a living dashboard that blends your favorite memories with the pulse of the market.

## ✨ Features

- **Cinematic Carousel**: Automatically loads images from `src/assets/backgrounds` and cycles them every 15 seconds with a silky smooth 2-second crossfade. No configuration needed—just drop your files in and watch.
- **Market Pulse**: Keep an eye on the big players (NVDA, AAPL, MSFT...) with real-time stock prices fetched directly from Yahoo Finance.
- **Featherlight**: Powered by Rust and React, it uses a fraction of the resources of a browser-based electron app.

## 🚀 Quick Start

1. **Add your photos**:
   Drop your `.jpg`, `.png`, or `.webp` files into:
   ```
   src/assets/backgrounds/
   ```

2. **Run it**:
   ```bash
   npm install
   npm run tauri dev
   ```

## 🛠️ Tech Stack

- **Core**: [Tauri v2](https://tauri.app) (Rust + Webview)
- **Frontend**: React + TypeScript + Vite
- **Animations**: Framer Motion
- **Data**: Yahoo Finance API (via Tauri HTTP plugin)

## 🐧 Ubuntu Deployment (Kiosk Mode)

Turn any Ubuntu machine into a dedicated photo frame.

### 1. Prepare for Fullscreen
To make the app launch in fullscreen automatically, modify `src-tauri/tauri.conf.json`:
```json
"windows": [
  {
    "fullscreen": true,
    // ... other settings
  }
]
```

### 2. Install Dependencies
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 3. Build & Install
```bash
npm run tauri build
# Install the generated .deb file
sudo dpkg -i src-tauri/target/release/bundle/deb/tauri-app_0.1.0_amd64.deb
```

### 4. Auto-start on Login
Create an autostart entry to launch the app when the desktop loads.

Create `~/.config/autostart/album.desktop`:
```ini
[Desktop Entry]
Type=Application
Name=Album
Exec=/usr/bin/tauri-app
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Comment=Start Album automatically
```

---
*Enjoy the view.* ☕
