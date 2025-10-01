# Instagram Post Grabber Chrome Extension

Eine moderne Chrome Extension zum Downloaden von Instagram Posts mit TypeScript und Tailwind CSS.

## Features

- 🖼️ **Hochauflösende Bilder** - Lädt Instagram Posts in voller Auflösung herunter
- 🎥 **Video-Thumbnails** - Download von Video-Thumbnails
- 📱 **Carousel-Support** - Unterstützt Instagram Carousel-Posts
- 🎨 **Moderne UI** - Schöne Benutzeroberfläche mit Tailwind CSS
- ⚙️ **Einstellungen** - Konfigurierbare Download-Optionen
- 🔄 **TypeScript** - Typsichere Entwicklung
- 📦 **Vite Build** - Schnelles und modernes Build-System

## Installation

### Entwicklung

1. **Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Development Build:**
   ```bash
   npm run dev
   ```

3. **Production Build:**
   ```bash
   npm run build
   ```

4. **Extension laden:**
   - Öffne Chrome und gehe zu `chrome://extensions/`
   - Aktiviere "Entwicklermodus"
   - Klicke "Entpackte Erweiterung laden"
   - Wähle den `dist` Ordner aus

### Verwendung

1. Gehe zu [Instagram.com](https://instagram.com)
2. Navigiere zu einem Post
3. Klicke auf den ▶ Button, der über dem Post erscheint
4. Die Extension lädt automatisch alle Bilder des Posts herunter
5. Für Carousel-Posts navigiert die Extension automatisch durch alle Slides

## Projektstruktur

```
src/
├── core/                 # Kern-Funktionalität
│   ├── background.ts     # Service Worker
│   └── content.ts        # Content Script
├── ui/                   # Benutzeroberfläche
│   ├── popup.html        # Popup Interface
│   └── popup.ts          # Popup Logic
├── assets/               # Statische Assets
│   ├── styles/           # CSS-Dateien
│   │   ├── popup.css     # Popup Styles
│   │   └── content.css   # Content Script Styles
│   └── icons/            # Extension Icons
├── utils/                # Utility-Funktionen
│   ├── dateUtils.ts      # Datum-Funktionen
│   ├── domUtils.ts       # DOM-Funktionen
│   ├── filenameUtils.ts  # Dateiname-Funktionen
│   └── storageUtils.ts   # Storage-Funktionen
├── types/                # TypeScript-Definitionen
│   └── index.ts          # Zentrale Typen
├── config/               # Konfiguration
│   └── constants.ts      # Konstanten
└── manifest.json         # Extension Manifest
```

## Technologie-Stack

- **TypeScript** - Typsichere JavaScript-Entwicklung
- **Tailwind CSS** - Utility-first CSS Framework
- **Vite** - Schnelles Build-Tool
- **Chrome Extension API** - Chrome Extension Funktionalität

## Einstellungen

Die Extension bietet verschiedene Einstellungen:

- **Auto-Download** - Automatischer Download bei neuen Posts
- **Videos herunterladen** - Download von Video-Thumbnails
- **Thumbnails herunterladen** - Download von Video-Thumbnails
- **Ordnerstruktur** - Organisierung der Downloads
- **Max. Posts** - Begrenzung der Anzahl der Posts

## Entwicklung

### Scripts

- `npm run dev` - Development Server starten
- `npm run build` - Production Build erstellen
- `npm run preview` - Build Preview
- `npm run type-check` - TypeScript Type Checking

### Build-Prozess

1. TypeScript wird zu JavaScript kompiliert
2. Tailwind CSS wird verarbeitet
3. Vite erstellt optimierte Bundles
4. Manifest und Icons werden kopiert

## Lizenz

MIT License - siehe LICENSE Datei für Details.

## Beitragen

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## Support

Bei Problemen oder Fragen erstelle bitte ein Issue im GitHub Repository.
