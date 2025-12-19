# 🖼️ Album

**Your desktop, reimagined.**

![Preview](./preview.png)

Album is a lightweight digital photo frame and dashboard built with **Tauri v2**. It turns your screen into a living display that cycles through your favorite memories while keeping you updated with real-time stock and weather data.

## ✨ Features

- **Cinematic Carousel**: Automatically cycles through images in your backgrounds folder with smooth crossfade transitions.
- **Market Pulse**: Real-time stock prices (NVDA, AAPL, MSFT...) fetched from Yahoo Finance.
- **Weather Integration**: Local weather updates based on your configuration.
- **Debug Panel**: Built-in console and directory shortcuts for easy management.
- **Featherlight**: High performance and low resource usage thanks to Rust and React.

---

##  macOS Binary Usage

To get started on macOS without a development environment:

1.  **Download**: Get the latest `.dmg` or `.app` from the [Releases](#) (if available).
2.  **Install**: Drag `Album` to your `Applications` folder.
3.  **Permissions**: On the first launch, you may need to right-click and select "Open" to bypass macOS Gatekeeper.
4.  **Setup**:
    - Press **`** (the key below Esc) to open the **Debug Panel**.
    - Click **"Open Backgrounds"** and drop your photos (`.jpg`, `.png`, `.webp`) into the folder.
    - Click **"Open Config Folder"** to edit `config.json` for custom stocks or weather.
    - **Restart** the app to see your changes!

---

## ⌨️ Usage & Shortcuts

- **`** (Backtick): Toggle the **Debug Panel / Console**.
- **Arrow Right**: Switch to the **next** image.
- **Arrow Left**: Switch to the **previous** image.
- **Debug Panel**:
  - View real-time logs of data fetching and image loading.
  - **Open Backgrounds**: Directly opens the folder where the app looks for images.
  - **Open Config Folder**: Opens the system folder containing your configuration settings.

---

## ⚙️ Configuration (`config.json`)

The configuration file is located in your system's AppData directory (accessible via the Debug Panel).

### Example `config.json`
```json
{
  "stocks": ["NVDA", "AAPL", "GOOGL", "MSFT", "TSLA"],
  "crypto": ["BTC-USD", "ETH-USD", "SOL-USD"],
  "interval": 30,
  "weather": {
    "city": "San Francisco",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

- **stocks**: An array of Yahoo Finance ticker symbols.
- **crypto**: An array of Yahoo Finance crypto symbols (e.g., `BTC-USD`).
- **interval**: Time in seconds between image changes (default: `30`).
- **weather**: Coordinates and city name for the weather display.

---

## 🚀 Development Quick Start

1. **Prerequisites**: [Rust](https://rustup.rs/) and [Node.js](https://nodejs.org/).
2. **Setup**:
   ```bash
   npm install
   ```
3. **Run Dev Mode**:
   ```bash
   npm run tauri dev
   ```
4. **Build Distribution**:
   ```bash
   npm run tauri build
   ```

---

## 🐧 Ubuntu Deployment (Kiosk Mode)

### 1. Install Dependencies
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

### 2. Build & Install
```bash
npm run tauri build
# Install the generated .deb file
sudo dpkg -i src-tauri/target/release/bundle/deb/tauri-app_0.1.0_amd64.deb
```

### 3. Auto-start on Login
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
