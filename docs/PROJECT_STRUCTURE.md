# KeyBard Project Structure

## Directory Layout

```
keybard/
├── .github/                    # GitHub configuration
│   └── workflows/             # CI/CD workflows
│       ├── prod-pages.yml     # Production deployment
│       └── rebuild-pages.yml  # Page rebuild automation
│
├── docs/                      # Documentation (generated)
│   ├── ARCHITECTURE.md        # System architecture overview
│   ├── API_REFERENCE.md       # API documentation
│   ├── PROJECT_STRUCTURE.md   # This file
│   └── DEVELOPER_GUIDE.md     # Development guidelines
│
├── ghpages/                   # GitHub Pages deployment
│
├── html/                      # HTML templates and components
│   ├── index.html            # Application shell
│   ├── mainboard.html        # Main keyboard display
│   ├── allboards.html        # Sample boards container
│   ├── menu.html             # Settings menu
│   ├── macro.html            # Macro editor
│   ├── tapdance.html         # Tap dance editor
│   ├── keyoverrides.html     # Key override editor
│   ├── keymods.html          # Modifier selection
│   ├── floats.html           # Floating UI elements
│   ├── scripts.html          # Script includes
│   ├── css.html              # Stylesheet includes
│   ├── launch.html           # Launch screen
│   ├── nosupport.html        # Browser compatibility
│   ├── floats/               # Floating UI components
│   │   └── *.html            # Modal/tooltip templates
│   ├── kcs/                  # Keyboard character sets
│   │   ├── qwerty.html       # QWERTY layout
│   │   ├── azerty.html       # AZERTY layout
│   │   ├── media.html        # Media keys
│   │   ├── quantum.html      # QMK special keys
│   │   └── *.html            # Other layouts
│   └── tips/                 # Help tooltips
│       └── *.html            # Tip content
│
├── keygen/                   # Key generation tools
│   └── (build artifacts)     # Generated key mappings
│
├── pages/                    # Main application files
│   ├── index.html           # Compiled main page
│   ├── css/                 # Stylesheets
│   │   ├── main.css         # Main styles
│   │   ├── keys.css         # Key styling
│   │   └── *.css            # Component styles
│   ├── images/              # Image assets
│   │   └── *.svg            # Icons and graphics
│   ├── js/                  # JavaScript modules
│   │   ├── kbinfo.js        # Core keyboard state
│   │   ├── actions.js       # Event system
│   │   ├── util.js          # Utilities
│   │   ├── keys.js          # Key management
│   │   ├── keygen.js        # Generated key maps
│   │   ├── browserutil.js   # Browser utilities
│   │   ├── ckeymap.js       # Custom keymap logic
│   │   ├── coloris.js       # Color picker
│   │   ├── jskeys.js        # JavaScript key codes
│   │   ├── kbifile.js       # File I/O
│   │   ├── kbihistory.js    # History management
│   │   ├── kle.js           # KLE import/export
│   │   ├── languages.js     # i18n support
│   │   ├── main.js          # Entry point
│   │   ├── misc.js          # Miscellaneous
│   │   ├── qmk_settings.js  # QMK configuration
│   │   ├── usbhid.js        # USB communication
│   │   ├── kbui/            # UI components
│   │   │   ├── mainboard.js     # Main board UI
│   │   │   ├── binding.js       # Key binding UI
│   │   │   ├── macros.js        # Macro UI
│   │   │   ├── tapdance.js      # Tap dance UI
│   │   │   ├── combo.js         # Combo UI
│   │   │   ├── keyoverride.js   # Override UI
│   │   │   ├── qmk.js           # QMK settings UI
│   │   │   ├── sampleboards.js  # Sample board UI
│   │   │   ├── files.js         # File handling UI
│   │   │   ├── languages.js     # Language UI
│   │   │   ├── examples.js      # Example layouts
│   │   │   ├── keypane.js       # Key pane UI
│   │   │   ├── keycontents.js   # Key content UI
│   │   │   ├── matrixtester.js  # Matrix test UI
│   │   │   └── updateall.js     # Update coordinator
│   │   ├── vial/            # Vial protocol
│   │   │   ├── api.js          # API wrapper
│   │   │   ├── vial.js         # Protocol core
│   │   │   ├── usb.js          # USB layer
│   │   │   ├── kb.js           # Keyboard ops
│   │   │   ├── macro.js        # Macro protocol
│   │   │   ├── tapdance.js     # Tap dance protocol
│   │   │   ├── combo.js        # Combo protocol
│   │   │   ├── keyoverride.js  # Override protocol
│   │   │   ├── qmk.js          # QMK protocol
│   │   │   ├── sval.js         # Svalboard specific
│   │   │   └── init.js         # Initialization
│   │   └── samples/         # Sample data
│   │       └── *.json       # Sample configs
│   ├── samples/             # Sample boards
│   │   └── boards/
│   │       └── index.json   # Board definitions
│   └── thirdparty/          # External libraries
│       └── (vendor files)
│
├── custom_keys.py           # Custom key generator
├── devserver.py             # Development server
├── rebuild_templates.py     # Template builder
├── README.md                # Project readme
├── SNIPPETS.md              # Code snippets
├── TODO.md                  # Project tasks
└── .gitignore              # Git ignore rules
```

## File Organization

### Core Application (`pages/js/`)

#### State Management
- `kbinfo.js` - Central keyboard state
- `kbihistory.js` - Undo/redo system

#### Event System
- `actions.js` - Event routing
- `util.js` - Event utilities

#### Key Management
- `keys.js` - Key operations
- `keygen.js` - Generated mappings
- `jskeys.js` - JavaScript keycodes
- `ckeymap.js` - Custom keymaps

#### Communication
- `usbhid.js` - WebUSB interface
- `vial/*.js` - Protocol implementation

#### File Operations
- `kbifile.js` - Import/export
- `kle.js` - KLE format support

#### UI Framework
- `browserutil.js` - Browser APIs
- `main.js` - Application entry
- `misc.js` - Helper functions

### UI Components (`pages/js/kbui/`)

Self-contained modules with minimal dependencies:

#### Core UI
- `mainboard.js` - Keyboard visualization
- `binding.js` - Key binding interface
- `updateall.js` - Update coordination

#### Feature Editors
- `macros.js` - Macro configuration
- `tapdance.js` - Tap dance setup
- `combo.js` - Combo configuration
- `keyoverride.js` - Override setup
- `qmk.js` - QMK settings

#### Support UI
- `sampleboards.js` - Sample keyboards
- `files.js` - File operations
- `languages.js` - Localization
- `examples.js` - Example layouts
- `keypane.js` - Key selection
- `keycontents.js` - Key details
- `matrixtester.js` - Testing tools

### HTML Templates (`html/`)

#### Main Templates
- `index.html` - Application shell
- `mainboard.html` - Keyboard display
- `allboards.html` - Sample container
- `menu.html` - Settings interface

#### Feature Templates
- `macro.html` - Macro editor
- `tapdance.html` - Tap dance editor
- `keyoverrides.html` - Override editor
- `keymods.html` - Modifier selector

#### Support Templates
- `floats.html` - Floating elements
- `scripts.html` - Script includes
- `css.html` - Style includes
- `launch.html` - Startup screen
- `nosupport.html` - Compatibility

### Sample Keyboards (`html/kcs/`)

Pre-defined keyboard layouts:
- Standard layouts (QWERTY, AZERTY, Dvorak, etc.)
- Specialized (media, quantum, international)
- Dynamic (layers, macros, custom)

### Styles (`pages/css/`)

Component-specific stylesheets:
- `main.css` - Global styles
- `keys.css` - Key appearance
- Component-specific CSS files

### Build Tools

#### Python Scripts
- `devserver.py` - Local development server
- `rebuild_templates.py` - Template compilation
- `custom_keys.py` - Key code generation

#### CI/CD (`.github/workflows/`)
- `prod-pages.yml` - Production deployment
- `rebuild-pages.yml` - Automated rebuilds

## Module Dependencies

### Dependency Hierarchy

```
util.js (Foundation)
    ↓
actions.js (Events)
    ↓
kbinfo.js (State)
    ↓
keys.js (Operations)
    ↓
kbui/*.js (UI Components)
    ↓
vial/*.js (Hardware)
```

### Module Coupling

- **Loose Coupling**: UI modules independent
- **Tight Coupling**: Vial modules interdependent
- **Global Access**: Limited to essentials (KBINFO, ACTION)

## Build Process

### Development

1. Run `python devserver.py`
2. Edit source files in `html/` and `pages/js/`
3. Changes reflect immediately (no build step)

### Production

1. Run `python rebuild_templates.py`
2. Compiles `html/*.html` → `pages/index.html`
3. Deploy `pages/` directory

### Key Generation

1. Update QMK definitions
2. Run `python custom_keys.py`
3. Generates `pages/js/keygen.js`

## Configuration Files

### Git Configuration
- `.gitignore` - Standard Python/JS ignores
- `.github/workflows/` - GitHub Actions CI/CD

### Sample Data
- `pages/samples/boards/index.json` - Board definitions
- Individual sample configurations

## Asset Organization

### Images (`pages/images/`)
- SVG icons and graphics
- Keyboard visualizations
- UI elements

### Third-Party (`pages/thirdparty/`)
- External libraries
- Vendor dependencies
- Polyfills

## Development Patterns

### File Naming
- JavaScript: `lowercase.js`
- HTML templates: `lowercase.html`
- CSS: `lowercase.css`
- Python: `snake_case.py`

### Code Organization
- One module per file
- Clear separation of concerns
- Minimal global namespace pollution
- Self-documenting structure

### Module Pattern

```javascript
// Wrapped in initializer
addInitializer('load', () => {
    // Private functions
    function privateHelper() {}

    // Public API
    GLOBAL.publicAPI = {
        method: () => {}
    };
});
```