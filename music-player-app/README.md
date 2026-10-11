# PulseStream — Music Streaming Player

A modern music streaming web application built with the official YouTube IFrame Player & Data API v3, featuring the full capability suite inspired by YMusic.

---

## 🚀 Features

### 🎧 Core Playback & Audio Controls
- **Background & Lock Screen Playback**: Full support for the W3C **Media Session API** (`navigator.mediaSession`) — control playback, skip tracks, and view album artwork from Windows media keys, lock screen, and system media overlays.
- **Floating Mini Player (PiP)**: Keep music playback controls visible in a draggable/dockable corner widget while browsing.
- **Sleep Timer**: Set countdown timers (15m, 30m, 45m, 1h, 1.5h, 2h) with real-time remaining countdown and auto-pause.
- **5-Band Equalizer & Presets**: Includes Flat, Bass Boost, Treble, Vocal, Rock, and Electronic sound profiles with vertical slider controls.
- **Variable Playback Speed**: Change playback rate from 0.25x up to 2.0x.

### 📋 Library & Playlist Management
- **Custom Playlists**: Create, name, delete, and curate multiple custom playlists.
- **Add to Playlist**: 1-click modal picker to add any track to custom collections.
- **Queue System**: Inspect, reorder, remove individual items, or clear all.
- **Listening History**: Automatically captures your last 100 played songs.
- **Favorites**: Heart any track to save it to your dedicated Favorites library.

### 🔍 Discovery & Content
- **Live Search**: YouTube search with auto-debounce and instant recognition of raw YouTube video IDs or URLs (`youtu.be/...`).
- **Trending Music**: Regional trending music feeds with view counters and duration formatting.
- **16 Curated Genres**: Pop, Hip Hop, Lofi Chill, Rock, Electronic, R&B, Jazz, Classical, Bollywood, K-Pop, Latin, Ambient, Country, Devotional, Workout, and NCS.
- **Up Next / Related Tracks**: Automatic recommendations displayed inside the expanded full-screen player.
- **Share**: Native Web Share API integration or clipboard copying.

---

## 🌐 Local Access & Embedding

### Live URL
Open in your browser:
**`http://localhost:3000/`**

### Responsive IFrame Embed
Embed PulseStream directly inside any web application:

```html
<iframe 
  src="http://localhost:3000/" 
  width="100%" 
  height="100vh" 
  style="border:none; border-radius:12px;"
  allow="autoplay; encrypted-media; fullscreen"
  title="PulseStream Music Player">
</iframe>
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `Space` | Play / Pause toggle |
| `←` / `→` | Seek backward / forward 5 seconds |
| `↑` / `↓` | Increase / decrease volume |
| `M` | Mute / unmute |
| `N` | Next track in queue |
| `P` | Previous track |
| `/` | Focus search bar immediately |
