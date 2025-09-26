# KeyBard Documentation Index

Welcome to the KeyBard documentation! KeyBard is a web-based keyboard configurator for Svalboard keyboards running Vial firmware.

## Quick Start

1. **For Users**: See the main [README.md](../README.md) for usage instructions
2. **For Developers**: Start with the [Developer Guide](DEVELOPER_GUIDE.md)
3. **For Contributors**: Review the [Project Structure](PROJECT_STRUCTURE.md)

## Documentation Overview

### Core Documentation

#### [Architecture Overview](ARCHITECTURE.md)
Comprehensive system design documentation covering:
- High-level system architecture
- Core components and their interactions
- Data flow patterns
- Design patterns and principles
- Extension points

#### [API Reference](API_REFERENCE.md)
Complete API documentation including:
- Core KBINFO state management
- KBAPI keyboard interface
- Event system (ACTION)
- UI component APIs
- File I/O operations
- Vial protocol implementation

#### [Project Structure](PROJECT_STRUCTURE.md)
Detailed project organization:
- Directory layout and file organization
- Module dependencies
- Build process
- Configuration files
- Asset management

#### [Developer Guide](DEVELOPER_GUIDE.md)
Practical development guidance:
- Getting started instructions
- Development workflow
- Code style guidelines
- Adding new features
- Testing procedures
- Troubleshooting

## Key Concepts

### KBINFO
The central keyboard state object that maintains all configuration data. Two instances exist:
- `KBINFO`: Current editable state
- `BASE_KBINFO`: Last committed state

### Initializer System
Event-driven initialization pattern:
- `'load'` initializers: Run on page load
- `'connected'` initializers: Run on keyboard connection

### Change Queue
Transaction-based change management:
- Queue mode: Batch changes for single commit
- Instant mode: Apply changes immediately

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Communication**: WebUSB API
- **Protocol**: Vial/QMK
- **Development**: Python (build tools)
- **Deployment**: Static site (GitHub Pages compatible)

## Quick Reference

### File Locations

| Component | Location |
|-----------|----------|
| Main Application | `pages/index.html` |
| JavaScript Core | `pages/js/*.js` |
| UI Components | `pages/js/kbui/*.js` |
| Vial Protocol | `pages/js/vial/*.js` |
| HTML Templates | `html/*.html` |
| Sample Boards | `html/kcs/*.html` |
| Stylesheets | `pages/css/*.css` |

### Key Modules

| Module | Purpose |
|--------|---------|
| `kbinfo.js` | State management |
| `actions.js` | Event handling |
| `util.js` | Utilities and init system |
| `keys.js` | Key code operations |
| `usbhid.js` | USB communication |
| `mainboard.js` | Keyboard visualization |

### Common Tasks

#### Adding a Sample Board
1. Create HTML in `html/kcs/`
2. Register in `html/allboards.html`

#### Adding a UI Component
1. Create module in `pages/js/kbui/`
2. Add to `html/scripts.html`
3. Register in `updateall.js`

#### Extending Protocol
1. Add handler in `pages/js/vial/`
2. Wrap in KBAPI (`kbinfo.js`)
3. Create UI if needed

## Development Commands

```bash
# Start development server
python devserver.py

# Build for production
python rebuild_templates.py

# Regenerate key mappings
python custom_keys.py
```

## Contributing

We welcome contributions! Please:

1. Read the [Developer Guide](DEVELOPER_GUIDE.md)
2. Follow the code style guidelines
3. Test your changes thoroughly
4. Update documentation as needed
5. Submit a pull request

## Support

- **Documentation**: This directory
- **Issues**: GitHub issue tracker
- **Discussions**: GitHub discussions
- **Main README**: [README.md](../README.md)

## License

See the main repository for license information.

---

*Last updated: Current as of the electron branch*