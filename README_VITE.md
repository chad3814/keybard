# KeyBard - Vite + React + TypeScript Setup

[![Test Coverage](https://img.shields.io/codecov/c/github/chad3814/keybard?style=flat-square&label=coverage)](https://codecov.io/gh/chad3814/keybard)
[![Tests](https://img.shields.io/github/actions/workflow/status/chad3814/keybard/test.yml?branch=main&style=flat-square&label=tests)](https://github.com/chad3814/keybard/actions/workflows/test.yml)

Quick reference for the new Vite-based UI alongside the original Python setup.

## Quick Start

### Original Setup (Unchanged)

```bash
source .venv/bin/activate
python devserver.py
# → http://localhost:8000
```

### New Vite Setup

```bash
npm install        # First time only
npm run dev        # Development
# → http://localhost:5173
```

## Project Structure

```text
keybard/
├── pages/          # Original HTML/JS (untouched)
│   ├── js/vial/   # Original Vial JS modules
│   └── index.html
├── src/           # NEW: Vite + React + TypeScript
│   ├── constants/      # KeyMap constants
│   ├── components/     # React components
│   ├── contexts/       # VialContext
│   ├── services/       # TypeScript Vial services
│   │   ├── key.service.ts
│   │   ├── usb.ts
│   │   ├── utils.ts
│   │   └── vial.service.ts
│   └── types/         # TypeScript definitions
└── dist/          # Build output (gitignored)
```

## Key Technologies

- **React 19** with TypeScript
- **Vite** for fast dev server and builds
- **xz-decompress** for XZ decompression (keyboard data, includes types)
- **WebHID API** for USB keyboard communication

## Available Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Integration Points

### VialContext Hook

```tsx
import { useVial } from './contexts/VialContext';

function MyComponent() {
  const { keyboard, isConnected, connect, loadKeyboard } = useVial();

  // Use Vial services...
}
```

### Services Available

- `VialUSB` - USB HID communication
- `VialService` - Keyboard operations (load, getKeyboardInfo, etc.)
- `KeyService` - Keycode parsing and stringifying (parse, stringify, define, etc.)
- Utilities - Byte manipulation (LE16, BE16, etc.)

## What's Working

✅ TypeScript conversion of core Vial modules
✅ USB communication layer
✅ XZ decompression via npm package (xz-decompress with built-in types)
✅ KEY utilities (keycode parsing, CODEMAP, KEYMAP, KEYALIASES)
✅ React Context provider
✅ Basic connection UI

## What's Next

- Keymap editor component
- Macro management UI
- Combo/tap-dance configuration
- Additional Vial features

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (during development)
npm run test:watch

# Open Vitest UI
npm run test:ui
```

### Test Coverage

This project maintains **90% code coverage** across:

- ✅ Utility functions and byte manipulation
- ✅ KeyService (keycode parsing, custom keys, layers)
- ✅ USB communication layer (mocked WebHID API)
- ✅ VialService (keyboard loading, keymap management)
- ✅ QMK settings service
- ✅ React Context state management

### Test Structure

```text
tests/
├── services/       # Service layer tests
├── contexts/       # React Context tests
├── fixtures/       # Test data and mocks
├── mocks/          # USB and API mocks
└── utils/          # Test utilities
```

### Writing Tests

Tests follow the AAA (Arrange-Act-Assert) pattern:

```typescript
it('should update key at specific position', async () => {
  // Arrange
  const layer = 0, row = 1, col = 2;
  const keymask = 0x0004; // KC_A

  // Act
  await vialService.updateKey(layer, row, col, keymask);

  // Assert
  expect(mockUSB.send).toHaveBeenCalledWith(/* ... */);
});
```

### CI/CD

Tests run automatically on:

- Pull requests (all commits)
- Pushes to main/master
- Coverage reports posted to PRs

## Important Notes

- **Both setups coexist independently**
- `pages/` directory is completely unchanged
- Python dev server works exactly as before
- No conflicts between old and new systems

See [VITE_SETUP.md](./VITE_SETUP.md) for detailed documentation.
