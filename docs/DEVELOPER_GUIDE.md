# KeyBard Developer Guide

## Getting Started

### Prerequisites

- Python 3.7+ (for development server)
- Modern web browser with WebUSB support (Chrome/Edge recommended)
- Git for version control
- Text editor or IDE

### Setting Up Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/keybard.git
   cd keybard
   ```

2. **Create Python virtual environment (optional but recommended):**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Start the development server:**
   ```bash
   python devserver.py
   # or
   ./devserver.py
   ```

4. **Open in browser:**
   Navigate to `http://localhost:8000`

## Development Workflow

### Making Changes

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Edit source files:**
   - HTML templates in `html/`
   - JavaScript in `pages/js/`
   - Styles in `pages/css/`

3. **Test changes:**
   - Refresh browser (no build step needed)
   - Test with actual keyboard if available
   - Test file import/export

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: descriptive message"
   ```

### Code Style Guidelines

#### JavaScript

```javascript
// Use const/let, never var
const CONSTANTS = {};
let mutableValue = 0;

// Descriptive function names
function updateKeyboardLayout() {
    // Implementation
}

// Use arrow functions for callbacks
ACTION.onclick('.key', (element) => {
    // Handle click
});

// Document complex functions
/**
 * Updates the key at specified position
 * @param {number} layer - Layer index
 * @param {number} kmid - Key matrix ID
 * @param {string} keystr - Key string
 */
function updateKey(layer, kmid, keystr) {
    // Implementation
}
```

#### HTML

```html
<!-- Use semantic HTML5 elements -->
<section id="keyboard-display">
    <header>
        <h2>Keyboard Layout</h2>
    </header>
    <div class="keyboard-container">
        <!-- Content -->
    </div>
</section>

<!-- Data attributes for JavaScript hooks -->
<button data-action="bind-key" data-layer="0" data-key="15">
    A
</button>
```

#### CSS

```css
/* Component-based naming */
.keyboard-container {
    display: flex;
    gap: 10px;
}

.keyboard-container__key {
    width: 40px;
    height: 40px;
}

/* State classes */
.keyboard-container__key--active {
    background: #007bff;
}
```

## Adding New Features

### Adding a New Sample Board

1. **Create HTML template:**
   ```html
   <!-- html/kcs/mylayout.html -->
   <div class="board-container">
       <div class="key" data-key="KC_A">A</div>
       <!-- More keys -->
   </div>
   ```

2. **Register in allboards.html:**
   ```html
   <!-- html/allboards.html -->
   <div id="mylayout" class="sample-board">
       <!-- Container -->
   </div>
   <button data-board="mylayout">My Layout</button>
   ```

3. **Add initialization (if dynamic):**
   ```javascript
   // pages/js/kbui/sampleboards.js
   addInitializer('load', () => {
       registerSampleBoard('mylayout', {
           init: () => {
               // Setup code
           }
       });
   });
   ```

### Adding a UI Component

1. **Create module file:**
   ```javascript
   // pages/js/kbui/mycomponent.js
   addInitializer('load', () => {
       // Private state
       let componentState = {};

       // Private functions
       function render() {
           // Rendering logic
       }

       // Public API
       window.MY_COMPONENT = {
           update: () => {
               render();
           }
       };

       // Event handlers
       ACTION.onclick('.my-component-trigger', (el) => {
           // Handle interaction
       });
   });

   addInitializer('connected', () => {
       // Setup that requires keyboard connection
       MY_COMPONENT.update();
   });
   ```

2. **Add to scripts.html:**
   ```html
   <!-- html/scripts.html -->
   <script src="js/kbui/mycomponent.js"></script>
   ```

3. **Register in updateAll:**
   ```javascript
   // pages/js/kbui/updateall.js
   function updateAll() {
       // ... existing updates
       if (window.MY_COMPONENT) {
           MY_COMPONENT.update();
       }
   }
   ```

### Extending the Protocol

1. **Add protocol handler:**
   ```javascript
   // pages/js/vial/myfeature.js
   const MY_FEATURE = {
       async get(kbinfo) {
           // Protocol implementation
           const data = await VIAL.command(0x01);
           return parseData(data);
       },

       async set(kbinfo, value) {
           // Protocol implementation
           const encoded = encodeValue(value);
           await VIAL.command(0x02, encoded);
       }
   };
   ```

2. **Wrap in KBAPI:**
   ```javascript
   // pages/js/kbinfo.js
   KBAPI.wrapped.updateMyFeature = async function(kbinfo) {
       await MY_FEATURE.set(kbinfo, kbinfo.myfeature);
   };

   KBAPI.updateMyFeature = async function() {
       await CHANGES.queue('myfeature', async () => {
           await KBAPI.wrapped.updateMyFeature(KBINFO);
       });
   };
   ```

## Testing

### Manual Testing Checklist

#### Basic Functionality
- [ ] Page loads without console errors
- [ ] Can connect to keyboard via USB
- [ ] Can view current keyboard layout
- [ ] Can modify keys and see changes

#### Key Operations
- [ ] Bind regular keys (A-Z, 0-9)
- [ ] Bind modifier combinations
- [ ] Bind special keys (layers, tap dance)
- [ ] Clear key bindings

#### Advanced Features
- [ ] Create and edit macros
- [ ] Configure tap dances
- [ ] Set up combos
- [ ] Configure key overrides
- [ ] Adjust QMK settings

#### File Operations
- [ ] Import .vil files
- [ ] Import .svl files
- [ ] Export current configuration
- [ ] Download and re-upload works

#### UI Responsiveness
- [ ] All buttons clickable
- [ ] Tooltips appear correctly
- [ ] Modals open and close
- [ ] Sample boards switch properly

### Browser Compatibility

Test in:
- Chrome/Chromium (primary)
- Edge (primary)
- Firefox (limited WebUSB)
- Safari (no WebUSB)

### Debugging Tips

#### Console Debugging

```javascript
// Enable verbose logging
window.DEBUG = true;

// Log KBINFO changes
console.log('Current KBINFO:', KBINFO);
console.log('Changes queued:', CHANGES.todo);

// Monitor USB communication
VIAL.debug = true;
```

#### Chrome DevTools

1. **USB Debugging:**
   - Navigate to `chrome://device-log`
   - Filter by "usb"
   - Monitor connection events

2. **Performance:**
   - Use Performance tab
   - Record key binding operations
   - Identify bottlenecks

3. **Memory:**
   - Take heap snapshots
   - Monitor for leaks during long sessions

## Common Issues

### WebUSB Permission Denied

**Problem:** Browser blocks USB access

**Solution:**
- Ensure HTTPS or localhost
- User must click to initiate connection
- Check browser USB permissions

### Keys Not Updating

**Problem:** Changes don't appear on keyboard

**Solution:**
```javascript
// Check instant mode
console.log('Instant mode:', SETTINGS.instant);

// Force commit
await CHANGES.commit();

// Verify communication
console.log('Connected:', VIAL.isConnected());
```

### Import Fails

**Problem:** File import doesn't work

**Solution:**
- Verify file format (.vil or .svl)
- Check console for parsing errors
- Ensure file isn't corrupted

## Building for Production

1. **Run template builder:**
   ```bash
   python rebuild_templates.py
   ```

2. **Generated files:**
   - `pages/index.html` - Combined application
   - All assets in `pages/` directory

3. **Deploy:**
   - Copy `pages/` directory to web server
   - Ensure HTTPS for WebUSB
   - Test production build locally first

## Contributing

### Pull Request Process

1. **Fork and clone repository**

2. **Create feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes and test thoroughly**

4. **Update documentation if needed**

5. **Submit pull request with:**
   - Clear description
   - Test results
   - Screenshots if UI changes

### Code Review Checklist

- [ ] Follows existing code style
- [ ] No console errors
- [ ] Tested with actual keyboard
- [ ] Documentation updated
- [ ] Backward compatible
- [ ] No security issues

## Resources

### Internal Documentation
- [Architecture Overview](ARCHITECTURE.md)
- [API Reference](API_REFERENCE.md)
- [Project Structure](PROJECT_STRUCTURE.md)

### External Resources
- [QMK Documentation](https://docs.qmk.fm/)
- [Vial Documentation](https://get.vial.today/docs/)
- [WebUSB API](https://wicg.github.io/webusb/)
- [Svalboard](https://svalboard.com)

## Support

### Getting Help

1. Check existing documentation
2. Search GitHub issues
3. Ask in discussions
4. Create detailed bug report

### Reporting Bugs

Include:
- Browser and OS version
- Keyboard model and firmware
- Steps to reproduce
- Console error messages
- Expected vs actual behavior