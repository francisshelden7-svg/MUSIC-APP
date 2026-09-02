# 🎵 NeonWave - Dynamic Cloudinary Music Player

> A cutting-edge, glassmorphic web music player powered by **Cloudinary Dynamic Media Delivery**, HTML5 Audio, and real-time **Web Audio API** frequency spectrum visualizers.

---

## ✨ Features

- **🎧 HTML5 Audio Engine & Controls**: Play, pause, seek scrubber, volume control, mute, repeat (All/One/Off), and shuffle modes.
- **📊 Real-Time Canvas Audio Visualizer**: 
  - **BARS**: Neon frequency spectrum analyzer with luminous top caps.
  - **WAVE**: Smooth oscilloscope waveform.
  - **RADIAL**: Circular frequency bars radiating outwards.
- **☁️ Dynamic Cloudinary Media Integration**:
  - Direct unsigned drag-and-drop audio and cover art upload widget.
  - Dynamic audio transformations (bitrate optimization: `128k`, `192k`, `320k`, auto-format `f_auto`).
  - Dynamic album art smart cropping and delivery.
  - Quick Cloudinary URL / Public ID importer.
- **📀 Cyberpunk Glassmorphic UI**:
  - Spinning vinyl record animation with micro-grooves and tonearm.
  - Ambient glowing backlights synchronized with playback.
  - Responsive desktop split-view & mobile-friendly layout.
- **🎶 Queue & Playlist Management**:
  - Filter by genre (`Synthwave`, `Electronic`, `Ambient`, `Cloudinary`, `Favorites`).
  - Real-time search by title or artist.
  - Persistent playlist storage with `localStorage`.
- **⌨️ Keyboard Shortcuts**:
  - `Space`: Play / Pause
  - `←` / `→`: Seek ±5 seconds
  - `↑` / `↓`: Volume ±5%
  - `M`: Mute toggle
  - `L`: Repeat mode cycle
  - `S`: Shuffle toggle

---

## 🚀 Getting Started

### 1. Running Locally (No Node/Python Required)
Simply launch the included PowerShell HTTP server:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1 -Port 8080
```
Open **`http://localhost:8080`** in any modern web browser.

### 2. Connecting Your Own Cloudinary Account
1. Open the player and click the **Cloud Status** badge in the header (or the Settings gear).
2. Enter your Cloudinary **Cloud Name** and **Unsigned Upload Preset** (from Cloudinary Console &rarr; *Settings > Upload > Upload Presets*).
3. Click **Save Settings**.
4. Use the **Upload to Cloudinary** button to upload audio and album art directly from your computer!

---

## 📂 Project Structure

```
my play/
├── index.html        # Main HTML5 application shell & modals
├── server.ps1        # Built-in lightweight HTTP static server with CORS
├── README.md         # Project documentation
├── .gitignore        # Git ignore rules
├── css/
│   └── style.css     # Glassmorphic cyberpunk design system
└── js/
    ├── app.js        # Main coordinator & event listeners
    ├── player.js     # Audio engine & Web Audio API setup
    ├── visualizer.js # Canvas spectrum, wave, and radial visualizers
    ├── playlist.js   # Playlist manager & local storage persistence
    └── cloudinary.js # Cloudinary upload & dynamic transformation API
```

---

## 📄 License
MIT License. Free to use and customize.
