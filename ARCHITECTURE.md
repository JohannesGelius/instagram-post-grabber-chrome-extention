# Architektur-Dokumentation

## Überblick

Diese Chrome Extension folgt einer modularen, skalierbaren Architektur mit klarer Trennung der Verantwortlichkeiten.

## Ordnerstruktur

```
src/
├── core/                 # Kern-Funktionalität
│   ├── background.ts     # Service Worker (Chrome Extension Background)
│   └── content.ts        # Content Script (Instagram-Seite)
├── ui/                   # Benutzeroberfläche
│   ├── popup.html        # Popup-Interface HTML
│   └── popup.ts          # Popup-Logic (Einstellungen, Status)
├── assets/               # Statische Assets
│   ├── styles/           # CSS-Dateien
│   │   ├── popup.css     # Popup-Styles (Tailwind CSS)
│   │   └── content.css   # Content Script Styles
│   └── icons/            # Extension Icons (verschiedene Größen)
├── utils/                # Utility-Funktionen
│   ├── dateUtils.ts      # Datum-Verarbeitung
│   ├── domUtils.ts       # DOM-Manipulation
│   ├── filenameUtils.ts  # Dateiname-Generierung
│   └── storageUtils.ts   # Chrome Storage API
├── types/                # TypeScript-Definitionen
│   └── index.ts          # Zentrale Typen und Interfaces
├── config/               # Konfiguration
│   └── constants.ts      # Konstanten und Konfiguration
└── manifest.json         # Chrome Extension Manifest
```

## Architektur-Prinzipien

### 1. **Separation of Concerns**
- **Core**: Geschäftslogik und Extension-Funktionalität
- **UI**: Benutzeroberfläche und Interaktionen
- **Utils**: Wiederverwendbare Hilfsfunktionen
- **Types**: Typsicherheit und Datenstrukturen
- **Config**: Konfiguration und Konstanten

### 2. **Modularität**
- Jede Utility-Klasse hat eine spezifische Verantwortlichkeit
- Einfache Imports und Exports
- Wiederverwendbare Komponenten

### 3. **Typsicherheit**
- Zentrale TypeScript-Definitionen
- Starke Typisierung für alle APIs
- IntelliSense-Unterstützung

### 4. **Skalierbarkeit**
- Einfache Erweiterung um neue Features
- Klare Abhängigkeiten
- Testbare Komponenten

## Komponenten-Details

### Core-Module

#### `background.ts`
- **Zweck**: Service Worker für Chrome Extension
- **Verantwortlichkeiten**:
  - Download-Management
  - Message-Handling
  - Extension-Lifecycle

#### `content.ts`
- **Zweck**: Content Script für Instagram
- **Verantwortlichkeiten**:
  - UI-Button-Erstellung
  - Post-Erkennung
  - Download-Triggering

### UI-Module

#### `popup.html` & `popup.ts`
- **Zweck**: Extension-Popup-Interface
- **Verantwortlichkeiten**:
  - Einstellungen-Verwaltung
  - Status-Anzeige
  - Benutzer-Interaktion

### Utility-Module

#### `dateUtils.ts`
- Datum-Formatierung
- Zeitstempel-Generierung
- Relative Zeit-Berechnung

#### `domUtils.ts`
- DOM-Element-Extraktion
- Instagram-spezifische Selektoren
- Event-Handler-Management

#### `filenameUtils.ts`
- Dateiname-Generierung
- Ordnerstruktur-Erstellung
- Dateiname-Sanitization

#### `storageUtils.ts`
- Chrome Storage API Wrapper
- Einstellungen-Persistierung
- Daten-Synchronisation

### Type-Definitionen

#### `types/index.ts`
- Zentrale Interface-Definitionen
- API-Typen
- Datenstrukturen

### Konfiguration

#### `constants.ts`
- Extension-Konfiguration
- Instagram-Selektoren
- Download-Parameter
- UI-Konstanten

## Datenfluss

```
User Interaction → Popup UI → Storage Utils → Background Script → Content Script → Instagram DOM
```

1. **Benutzer-Interaktion** im Popup
2. **Einstellungen-Speicherung** über Storage Utils
3. **Message-Passing** zwischen Popup und Content Script
4. **Download-Triggering** über Background Script
5. **DOM-Manipulation** auf Instagram-Seite

## Erweiterungsmöglichkeiten

### Neue Features hinzufügen
1. **Neue Utility-Module** in `utils/` erstellen
2. **Type-Definitionen** in `types/index.ts` erweitern
3. **Konstanten** in `config/constants.ts` hinzufügen
4. **UI-Komponenten** in `ui/` implementieren

### Neue Seiten unterstützen
1. **Content Script** erweitern
2. **Selektoren** in `constants.ts` anpassen
3. **DOM-Utils** erweitern

### Performance-Optimierung
1. **Lazy Loading** für große Module
2. **Caching** für häufige Operationen
3. **Debouncing** für Event-Handler

## Best Practices

### Code-Organisation
- **Ein Modul = Eine Verantwortlichkeit**
- **Konsistente Namenskonventionen**
- **Dokumentierte Funktionen**

### TypeScript
- **Starke Typisierung** für alle APIs
- **Interface-basierte Architektur**
- **Generics** für wiederverwendbare Komponenten

### Chrome Extension
- **Manifest V3** Compliance
- **Sichere Permissions**
- **Effiziente Message-Passing**

### Testing
- **Unit Tests** für Utility-Funktionen
- **Integration Tests** für Core-Module
- **E2E Tests** für UI-Komponenten
