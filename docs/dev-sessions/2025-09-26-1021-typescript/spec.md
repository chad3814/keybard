# TypeScript Conversion Specification

## Session: 2025-09-26-1021-typescript

## Objective
Convert the KeyBard JavaScript codebase to TypeScript to improve type safety, developer experience, and prepare for Electron migration.

## Goals

### Primary Goals
1. Convert all JavaScript files to TypeScript
2. Add comprehensive type definitions for core data structures
3. Modernize to ES6 modules with proper imports/exports
4. Implement reactive state management with MobX
5. Convert UI to Lit Elements for better component structure

### Secondary Goals
1. Improve code documentation through types
2. Identify and fix potential bugs through type checking
3. Set up modern build pipeline with Webpack
4. Prepare codebase for Electron migration via progressive enhancement
5. Establish comprehensive debugging and testing infrastructure

## Architecture Decisions

### Build System
- **Bundler**: Webpack (better Electron ecosystem support)
- **TypeScript**: 5.x with strict mode
- **Source maps**: Enabled for debugging
- **Hot reload**: Via webpack-dev-server

### Module System
- **ES6 Modules**: Full conversion from current initializer pattern
- **Decorators**: For lifecycle events (@OnLoad, @OnConnected)
- **Imports/Exports**: Explicit module dependencies

### State Management
- **MobX**: Observable state with reactive updates
- **Decorators**: @observable, @computed, @action
- **Two-state model**: Maintain KBINFO/BASE_KBINFO pattern but with MobX

### UI Components
- **Lit Elements**: Modern web components with TypeScript support
- **Shadow DOM**: For component encapsulation
- **Reactive**: Automatic updates on state changes

### Error Handling
- **Result Types**: Result<T, E> pattern for USB operations
- **Type-safe errors**: No exceptions in USB layer
- **Explicit handling**: All errors must be handled

### Data Validation
- **Zod**: Runtime validation with TypeScript type inference
- **Protocol safety**: All USB/Vial messages validated
- **Schema-first**: Define protocols as Zod schemas

### File Structure
```
src/
├── settings/
│   ├── components/
│   │   └── SettingsPanel.ts
│   ├── state/
│   │   └── SettingsStore.ts
│   ├── protocols/
│   │   └── QmkProtocol.ts
│   └── types/
│       └── Settings.types.ts
├── keyboard/
│   ├── components/
│   ├── state/
│   └── protocols/
├── macros/
│   ├── components/
│   ├── state/
│   └── protocols/
├── core/
│   ├── usb/
│   ├── decorators/
│   └── result/
├── shared/
│   ├── components/
│   └── utils/
└── types/
    └── global.d.ts
```

### Key Generation
- **Node.js generator**: Rewrite Python generator in TypeScript
- **Hybrid loading**: Core keys bundled, extended sets dynamic
- **Type generation**: Generate TypeScript types from key definitions

### Testing Strategy
- **Migration-focused**: Write tests for current JS version first
- **Playwright**: E2E tests for critical flows
- **Test preservation**: Ensure TS version passes same tests
- **Comprehensive tooling**: MobX DevTools, performance monitoring, error tracking

### Deployment
- **Progressive enhancement**: Single codebase, Electron features when available
- **Web-first**: Base build works in browser
- **Electron additions**: Enhanced features in Electron environment
- **Runtime detection**: Detect environment and enable features

## Migration Strategy

### Order of Migration
1. **Phase 0**: Write Playwright tests for current JS version
2. **Phase 1**: Setup Webpack, TypeScript, and basic infrastructure
3. **Phase 2**: Migrate Settings/QMK as proof of concept
4. **Phase 3**: Core modules (USB, state, protocols)
5. **Phase 4**: Keyboard visualization feature
6. **Phase 5**: Macros feature
7. **Phase 6**: Remaining features
8. **Phase 7**: Testing and validation

### Feature-by-Feature Approach
- Migrate one complete feature at a time
- Each feature includes: components, state, protocols
- Validate functionality after each feature
- Debug issues in isolation

### First Feature: Settings/QMK
- Simpler UI and state management
- Tests Lit Elements setup
- Validates MobX integration
- Proves decorator patterns work
- Good complexity balance

## Technical Requirements

### Type Coverage
- Strict mode enabled
- No implicit any
- All public APIs fully typed
- Zod schemas for all protocols
- Result types for fallible operations

### Browser Support
- Chrome/Chromium (primary)
- Edge (primary)
- WebUSB required for keyboard connection
- File-only mode for other browsers (future)
- WebHID consideration for future

### Developer Experience
- Full IntelliSense support
- MobX DevTools integration
- Performance monitoring
- Error tracking (Sentry)
- Custom keyboard debugging panel
- Playwright for automated testing

## Success Criteria

1. **Type Safety**: 100% TypeScript, no any types
2. **Tests Pass**: All Playwright tests from JS version pass
3. **Feature Parity**: Every feature works identically
4. **Performance**: No degradation vs JS version
5. **Developer Experience**: Full IDE support and debugging tools
6. **Code Quality**: Passes all linters, follows style guide
7. **Bundle Size**: <20% increase from JS version

## Constraints

- No breaking changes to user functionality
- Maintain keyboard compatibility
- Keep WebUSB as primary connection method
- Progressive migration (feature by feature)
- Single codebase for web and Electron

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lit Elements learning curve | Medium | Start with simple Settings component |
| MobX complexity | Medium | Use strict mode, clear patterns |
| USB protocol type safety | High | Zod validation on all messages |
| Bundle size growth | Low | Code splitting, dynamic imports |
| Migration duration | Medium | Feature-by-feature approach |
| Decorator support | Low | Use TypeScript 5.x with proper config |

## Dependencies

### Core
- typescript: ^5.x
- webpack: ^5.x
- webpack-dev-server: ^4.x
- ts-loader: ^9.x

### State & Reactivity
- mobx: ^6.x
- mobx-react-lite: ^3.x (if needed)
- lit: ^3.x

### Validation & Types
- zod: ^3.x

### Testing & Development
- @playwright/test: ^1.x
- @mobx-devtools/tools: latest
- sentry (for error tracking)

### Build Tools
- @types/node: latest
- @types/web: latest
- webpack-bundle-analyzer: ^4.x

## Next Steps

1. Set up base project structure with Webpack and TypeScript
2. Write Playwright tests for current Settings/QMK functionality
3. Create Zod schemas for QMK protocol messages
4. Implement Settings feature as proof of concept
5. Validate approach and adjust as needed
6. Continue with remaining features

## Notes

- This is not a production application yet, so we can be aggressive with modernization
- Focus on developer experience and code quality over backward compatibility
- Use this migration as opportunity to establish best practices
- Document patterns and decisions for future contributors