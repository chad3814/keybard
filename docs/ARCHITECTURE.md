# KeyBard Architecture Overview

## Introduction

KeyBard is a web-based keyboard configurator specifically designed for Svalboard keyboards running Vial firmware. It provides a comprehensive interface for customizing keyboard layouts, macros, and advanced QMK features through a browser-based application.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────┐
│         Web Browser (Client)            │
├─────────────────────────────────────────┤
│  ┌────────────┐  ┌─────────────────┐   │
│  │   HTML/UI  │  │  JavaScript Core │   │
│  └────────────┘  └─────────────────┘   │
│         ↓                ↓              │
│  ┌────────────┐  ┌─────────────────┐   │
│  │  UI Module │  │    Core Logic   │   │
│  │   (kbui/)  │  │   (pages/js/)   │   │
│  └────────────┘  └─────────────────┘   │
│         ↓                ↓              │
│  ┌──────────────────────────────────┐   │
│  │       Vial Integration Layer     │   │
│  │         (pages/js/vial/)         │   │
│  └──────────────────────────────────┘   │
│                    ↓                    │
│  ┌──────────────────────────────────┐   │
│  │         WebUSB API               │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────┐
│    Keyboard (Svalboard with Vial)       │
└─────────────────────────────────────────┘
```

## Core Components

### 1. Frontend Layer

#### HTML Templates (`html/`)
- **index.html**: Main application entry point
- **mainboard.html**: Primary keyboard visualization
- **allboards.html**: Sample keyboard layouts container
- **menu.html**: Settings and configuration menu
- **floats.html**: Floating UI elements (tooltips, modals)

#### UI Components (`html/kcs/`)
- Sample keyboard layouts (QWERTY, AZERTY, etc.)
- Specialized input boards (media keys, quantum keys)

### 2. JavaScript Core (`pages/js/`)

#### Core Modules

- **kbinfo.js**: Central keyboard information management
  - KBINFO: Current editable keyboard state
  - BASE_KBINFO: Static reference state
  - CHANGES: Change queue management
  - KBAPI: Abstraction layer for keyboard operations

- **actions.js**: Event handling framework
  - Selector-based callback system
  - Centralized event routing
  - ACTION.onclick() and ACTION.trigger() patterns

- **util.js**: Foundation utilities
  - DOM manipulation helpers
  - Element creation utilities
  - Initializer system (load/connected events)
  - Global definitions

- **keys.js**: Key code management
  - Key parsing and validation
  - QMK/Vial key code translation
  - Key string generation

- **keygen.js**: Generated key mappings
  - Auto-generated from QMK definitions
  - Vial and QMK alias support

### 3. UI Module System (`pages/js/kbui/`)

Encapsulated UI components with minimal global dependencies:

- **mainboard.js**: Primary keyboard visualization and interaction
- **binding.js**: Key binding interface
- **macros.js**: Macro editor and management
- **tapdance.js**: Tap dance configuration
- **combo.js**: Combo key setup
- **keyoverride.js**: Key override configuration
- **qmk.js**: QMK settings interface
- **sampleboards.js**: Dynamic sample board generation
- **files.js**: File import/export handling
- **languages.js**: Internationalization support
- **updateall.js**: Global update coordination

### 4. Vial Integration Layer (`pages/js/vial/`)

Hardware communication and protocol implementation:

- **usb.js**: WebUSB communication layer
- **vial.js**: Vial protocol implementation
- **api.js**: High-level API wrapper
- **kb.js**: Keyboard-specific operations
- **macro.js**: Macro protocol handling
- **tapdance.js**: Tap dance protocol
- **combo.js**: Combo protocol
- **keyoverride.js**: Key override protocol
- **qmk.js**: QMK settings protocol
- **sval.js**: Svalboard-specific extensions

## Data Flow

### 1. Initialization Flow

```
Page Load
    ↓
util.js initializers ('load')
    ↓
UI Component setup
    ↓
Device Connection / File Upload
    ↓
initializers ('connected')
    ↓
KBINFO population
    ↓
UI Update
```

### 2. Key Edit Flow

```
User clicks key →
    ACTION.onclick() →
    Binding UI opens →
    User selects new key →
    KBINFO updated →
    CHANGES.queue() →
    (Instant mode: Immediate commit)
    (Queue mode: Wait for commit)
```

### 3. Commit Flow

```
User clicks Commit →
    CHANGES.commit() →
    For each queued change:
        KBAPI.updateX() →
        VIAL protocol →
        USB communication →
        Keyboard update
    BASE_KBINFO = KBINFO
```

## Key Design Patterns

### 1. Two-State Model

- **KBINFO**: Current working state (editable)
- **BASE_KBINFO**: Committed state (reference)
- Enables instant and queued change modes
- Supports rollback and diff generation

### 2. Initializer Pattern

```javascript
addInitializer('load', () => {
    // Setup code that runs on page load
});

addInitializer('connected', () => {
    // Setup code that runs on device connection
});
```

### 3. Selector-Based Events

```javascript
ACTION.onclick('.key', (element) => {
    // Handle click on any element matching '.key'
});
```

### 4. Change Queue System

- Changes tracked by type and index
- Deduplication of multiple edits
- Batch commit capability
- Instant mode bypass option

## File Formats

### 1. .svl (KeyBard Native)
- JSON format containing complete keyboard state
- Includes cosmetic/UI customizations
- Full KBINFO structure preservation

### 2. .vil (Vial Format)
- Binary format from Vial GUI
- Limited information (requires defaults)
- Importable but loses some metadata

## Development Tools

### Python Scripts

- **devserver.py**: Development web server
- **rebuild_templates.py**: Template regeneration
- **custom_keys.py**: Custom key code generation

### Build System

- GitHub Actions workflows for deployment
- Template compilation process
- Key mapping generation from QMK

## Browser Requirements

- WebUSB API support (Chrome/Edge recommended)
- ES6+ JavaScript support
- Local storage for preferences

## Extension Points

### Adding Sample Boards

1. Create HTML template in `html/kcs/`
2. Register in `html/allboards.html`
3. Optional: Add dynamic generation in `sampleboards.js`

### Adding UI Features

1. Create module in `pages/js/kbui/`
2. Use initializer pattern for setup
3. Register update callback in `updateall.js`
4. Minimal global exposure

### Protocol Extensions

1. Extend appropriate module in `pages/js/vial/`
2. Update KBAPI wrapper in `kbinfo.js`
3. Add UI component if needed

## Performance Considerations

- Lazy loading of sample boards
- Efficient DOM updates via targeted selectors
- Batched USB operations
- Change deduplication

## Security Considerations

- WebUSB requires user permission
- No server-side component (fully client-side)
- Local storage only for preferences
- No external data transmission