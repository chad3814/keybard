# TypeScript Migration Implementation Plan

## Overview
This plan breaks down the TypeScript migration into small, safe, incremental steps. Each step builds on the previous one, with no orphaned code. The plan is structured as a series of prompts for implementation.

---

## Phase 0: Test Foundation (Capture Current Behavior)

### Step 0.1: Initialize Node.js Project

**Prompt:**
```
Create a package.json file in the project root with basic Node.js configuration. Include:
- Name: keybard
- Version: 0.1.0
- Scripts for test running
- Private: true
- Node engine requirement >= 18
```

### Step 0.2: Install Playwright

**Prompt:**
```
Install Playwright and set up initial test configuration:
- Install @playwright/test as dev dependency
- Create playwright.config.ts with Chrome-only configuration
- Set up test directory structure at tests/e2e/
- Configure to test against localhost:8000 (current Python server)
```

### Step 0.3: Create Settings/QMK Test Suite

**Prompt:**
```
Write Playwright tests for the current JavaScript Settings/QMK functionality:
- Test opening the settings panel
- Test viewing QMK settings
- Test modifying a QMK setting value
- Test that changes are reflected in the UI
- Create page object model for Settings UI elements
Store tests in tests/e2e/settings.spec.ts
```

### Step 0.4: Create Keyboard Connection Mock

**Prompt:**
```
Create a mock for WebUSB to test without physical keyboard:
- Mock navigator.usb API
- Create fixture data for a sample keyboard configuration
- Mock Vial protocol responses for QMK settings
- Ensure tests can run in CI without hardware
Store in tests/mocks/usb-mock.ts
```

---

## Phase 1: Build Infrastructure

### Step 1.1: TypeScript and Core Dependencies

**Prompt:**
```
Install TypeScript and core build dependencies:
- typescript@5.x with strict tsconfig.json
- webpack@5.x and webpack-cli
- webpack-dev-server for development
- ts-loader for TypeScript compilation
- html-webpack-plugin for HTML generation

Create tsconfig.json with:
- Strict mode enabled
- ES2022 target
- ESNext modules
- Decorator support enabled
- Source maps enabled
```

### Step 1.2: Webpack Configuration

**Prompt:**
```
Create webpack configuration with TypeScript support:
- webpack.config.ts for type-safe configuration
- Development and production modes
- TypeScript compilation via ts-loader
- HTML template processing
- Source maps for debugging
- Dev server with hot reload on port 3000
- Proxy /api calls to Python server if needed
```

### Step 1.3: Project Structure Setup

**Prompt:**
```
Create the new TypeScript project structure:
- Create src/ directory
- Create src/settings/, src/core/, src/shared/, src/types/ subdirectories
- Create src/index.ts as entry point
- Create public/index.html as HTML template
- Add .gitignore entries for node_modules and dist
- Create initial type definitions file at src/types/global.d.ts
```

### Step 1.4: Core Type Definitions

**Prompt:**
```
Create fundamental TypeScript type definitions:
- Define Result<T, E> type for error handling in src/core/result/types.ts
- Create Ok<T> and Err<E> helper functions
- Define WebUSB types if not available in @types/web
- Create basic KBINFO interface structure in src/types/kbinfo.types.ts
- Export all types from src/types/index.ts
```

---

## Phase 2: Core Utilities

### Step 2.1: Decorator System

**Prompt:**
```
Implement lifecycle decorator system to replace initializer pattern:
- Create @OnLoad decorator in src/core/decorators/lifecycle.ts
- Create @OnConnected decorator for device connection
- Implement decorator metadata storage
- Create lifecycle manager to trigger decorated methods
- Add tests for decorator functionality
```

### Step 2.2: Event Bus

**Prompt:**
```
Create event bus for module communication:
- Implement typed EventEmitter in src/core/events/EventBus.ts
- Define event types enum in src/core/events/types.ts
- Create singleton instance with dependency injection support
- Add methods: on, off, emit, once
- Include TypeScript generics for type-safe event payloads
```

### Step 2.3: Result Type Implementation

**Prompt:**
```
Implement Result type pattern for error handling:
- Create Result<T, E> with map, mapErr, unwrap methods
- Implement isOk() and isErr() type guards
- Create ResultAsync<T, E> for async operations
- Add chain() and recover() methods for composition
- Include unit tests for Result type
```

---

## Phase 3: State Management Foundation

### Step 3.1: Install MobX

**Prompt:**
```
Install and configure MobX for state management:
- Install mobx and mobx-devtools
- Configure MobX with strict mode
- Update tsconfig.json for decorator usage with MobX
- Create store configuration in src/core/state/configure.ts
- Set up development tools integration
```

### Step 3.2: Base Store Implementation

**Prompt:**
```
Create base MobX store class:
- Create abstract BaseStore in src/core/state/BaseStore.ts
- Add @observable decorators for state properties
- Add @action decorators for state mutations
- Implement undo/redo functionality
- Create store hydration/serialization methods
```

### Step 3.3: Settings Store

**Prompt:**
```
Implement Settings-specific MobX store:
- Create SettingsStore in src/settings/state/SettingsStore.ts
- Define QMK settings as @observable properties
- Create @action methods for updating settings
- Add @computed getters for derived values
- Implement two-state model (current vs committed)
- Wire up to event bus for change notifications
```

---

## Phase 4: Protocol Layer

### Step 4.1: Install Zod

**Prompt:**
```
Install Zod and create protocol validation:
- Install zod for runtime validation
- Create base protocol schemas in src/core/protocols/base.ts
- Define USB message structure schemas
- Create type inference from Zod schemas
- Add validation wrapper functions
```

### Step 4.2: QMK Protocol Schema

**Prompt:**
```
Define QMK settings protocol with Zod:
- Create QmkProtocol schemas in src/settings/protocols/QmkProtocol.ts
- Define setting types enum
- Create request/response message schemas
- Implement serialization/deserialization with validation
- Add protocol version checking
- Return Result types from all protocol methods
```

### Step 4.3: USB Communication Layer

**Prompt:**
```
Create USB communication abstraction:
- Create UsbDevice class in src/core/usb/UsbDevice.ts
- Wrap WebUSB API with Result types
- Add Zod validation for all messages
- Implement connection management
- Create mock-friendly interface for testing
- Add retry logic with exponential backoff
```

---

## Phase 5: UI Components with Lit

### Step 5.1: Install Lit

**Prompt:**
```
Install and configure Lit Elements:
- Install lit and @lit/reactive-element
- Install @lit/decorators for TypeScript
- Update webpack to handle Lit components
- Create base component class in src/shared/components/BaseElement.ts
- Set up CSS processing for Shadow DOM
```

### Step 5.2: Base Component Class

**Prompt:**
```
Create base Lit component with MobX integration:
- Extend LitElement with MobX observer functionality
- Add lifecycle decorator support
- Create render error boundaries
- Implement common styling system
- Add accessibility helpers
- Create component testing utilities
```

### Step 5.3: Settings Panel Component

**Prompt:**
```
Implement Settings Panel as Lit Element:
- Create SettingsPanel in src/settings/components/SettingsPanel.ts
- Use @customElement decorator
- Define @property decorators for props
- Connect to SettingsStore via dependency injection
- Implement Shadow DOM template with settings list
- Add @query decorators for DOM references
- Style with CSS-in-JS or CSS modules
```

### Step 5.4: Settings Item Component

**Prompt:**
```
Create individual setting item component:
- Create SettingItem in src/settings/components/SettingItem.ts
- Accept setting configuration as properties
- Render appropriate input based on setting type
- Handle value changes with Result type
- Dispatch events to parent component
- Include validation feedback UI
```

---

## Phase 6: Integration

### Step 6.1: Wire Components to Store

**Prompt:**
```
Connect Lit components to MobX store:
- Create store provider pattern in src/core/state/provider.ts
- Inject store into components via context
- Set up automatic re-rendering on store changes
- Implement two-way data binding for inputs
- Add error boundary for store errors
```

### Step 6.2: Connect to USB Layer

**Prompt:**
```
Integrate USB communication with Settings:
- Wire SettingsStore to UsbDevice
- Implement loadSettings() with Result handling
- Implement saveSettings() with validation
- Add connection status to store
- Handle USB errors gracefully with user feedback
```

### Step 6.3: Application Bootstrap

**Prompt:**
```
Create application entry point:
- Update src/index.ts with full application setup
- Initialize stores
- Set up event bus
- Trigger lifecycle decorators
- Mount root Lit component
- Set up development tools in dev mode
- Add error tracking setup
```

### Step 6.4: HTML Template Update

**Prompt:**
```
Update HTML template for TypeScript app:
- Modify public/index.html
- Add root element for Lit components
- Include any necessary polyfills
- Add loading state
- Set up CSP headers for WebUSB
- Include development/production conditionals
```

---

## Phase 7: Migration Verification

### Step 7.1: Run Playwright Tests

**Prompt:**
```
Verify TypeScript version passes all tests:
- Update Playwright config to test port 3000 (webpack-dev-server)
- Run all Settings/QMK tests
- Fix any failing tests
- Add new tests for TypeScript-specific features
- Ensure feature parity with JavaScript version
```

### Step 7.2: Bundle Analysis

**Prompt:**
```
Analyze and optimize bundle:
- Add webpack-bundle-analyzer
- Check bundle size against 20% increase limit
- Implement code splitting for features
- Lazy load extended key definitions
- Add production optimizations
- Generate bundle report
```

### Step 7.3: Development Experience

**Prompt:**
```
Set up development tools:
- Configure VS Code settings and extensions
- Add npm scripts for common tasks
- Set up debugging configuration
- Add pre-commit hooks with lint-staged
- Configure ESLint and Prettier
- Add type checking to CI pipeline
```

---

## Phase 8: Documentation and Cleanup

### Step 8.1: API Documentation

**Prompt:**
```
Generate API documentation:
- Add TSDoc comments to all public APIs
- Configure TypeDoc for documentation generation
- Create architecture diagrams
- Document Result type patterns
- Add MobX store documentation
- Create component storybook (if desired)
```

### Step 8.2: Migration Guide

**Prompt:**
```
Create migration documentation:
- Document architectural changes
- Create pattern guide for future features
- List breaking changes (should be none)
- Add troubleshooting section
- Create contributor guidelines
- Update main README
```

### Step 8.3: Cleanup

**Prompt:**
```
Clean up migration artifacts:
- Remove old JavaScript files for migrated features
- Update build scripts
- Clean up package.json
- Archive Python server (if replacing)
- Update CI/CD pipelines
- Tag version 1.0.0-ts
```

---

## Implementation Order Summary

1. **Foundation** (Steps 0.1-0.4): Testing framework
2. **Infrastructure** (Steps 1.1-1.4): Build system and types
3. **Core** (Steps 2.1-2.3): Decorators and utilities
4. **State** (Steps 3.1-3.3): MobX setup
5. **Protocol** (Steps 4.1-4.3): Zod and USB
6. **UI** (Steps 5.1-5.4): Lit components
7. **Integration** (Steps 6.1-6.4): Wire everything together
8. **Verification** (Steps 7.1-7.3): Testing and optimization
9. **Documentation** (Steps 8.1-8.3): Docs and cleanup

Each step is designed to be:
- Small enough to implement in 1-2 hours
- Complete with no orphaned code
- Testable independently
- Building on previous steps

Total estimated time: 40-60 hours of focused development