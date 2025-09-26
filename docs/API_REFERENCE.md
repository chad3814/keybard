# KeyBard API Reference

## Core APIs

### KBINFO Object

Central keyboard state management object.

#### Structure

```javascript
{
  layers: 16,                    // Number of layers
  rows: 10,                      // Matrix rows
  cols: 6,                       // Matrix columns
  keylayout: {},                 // Visual layout definition
  keymap: [],                    // 2D array of key assignments [layer][position]
  macro_count: 50,               // Maximum macros
  macros: [],                    // Macro definitions
  combo_count: 50,               // Maximum combos
  combos: [],                    // Combo definitions
  tapdance_count: 50,            // Maximum tap dances
  tapdances: [],                 // Tap dance definitions
  key_override_count: 30,        // Maximum key overrides
  key_override_entries: [],      // Key override definitions
  custom_keycodes: [],           // User-defined key codes
  settings: {},                  // QMK settings
  cosmetic: {},                  // UI customizations
  extra: {},                     // Additional metadata
  via_proto: 9,                  // Via protocol version
  vial_proto: 6                  // Vial protocol version
}
```

#### Global Variables

- **`KBINFO`**: Current editable keyboard state
- **`BASE_KBINFO`**: Last committed state
- **`DEFAULT_KBINFO`**: Default values template

#### Functions

##### `setActiveKBINFO(kbinfo, cause)`
Sets the active keyboard information object.

- **Parameters:**
  - `kbinfo` (Object): New keyboard information
  - `cause` (String): Reason for update (logging)
- **Returns:** void

### KBAPI Interface

Abstraction layer for keyboard operations.

#### Methods

##### `KBAPI.updateKey(layer, kmid, keystr)`
Updates a single key assignment.

- **Parameters:**
  - `layer` (Number): Layer index (0-15)
  - `kmid` (Number): Key matrix ID
  - `keystr` (String): Key string (e.g., "KC_A", "LCTL(KC_C)")
- **Returns:** Promise<void>

##### `KBAPI.updateMacros()`
Commits all macro changes to keyboard.

- **Returns:** Promise<void>

##### `KBAPI.updateTapdance(tdid)`
Updates a specific tap dance configuration.

- **Parameters:**
  - `tdid` (Number): Tap dance ID
- **Returns:** Promise<void>

##### `KBAPI.updateCombo(cmbid)`
Updates a specific combo configuration.

- **Parameters:**
  - `cmbid` (Number): Combo ID
- **Returns:** Promise<void>

##### `KBAPI.updateKeyoverride(koid)`
Updates a specific key override.

- **Parameters:**
  - `koid` (Number): Key override ID
- **Returns:** Promise<void>

##### `KBAPI.updateQMKSetting(qsid)`
Updates a QMK setting value.

- **Parameters:**
  - `qsid` (String): Setting ID
- **Returns:** Promise<void>

### CHANGES Queue System

Change management and commit system.

#### Methods

##### `CHANGES.queue(desc, callback)`
Queues a change for commit.

- **Parameters:**
  - `desc` (String): Change descriptor (e.g., "key,0,15")
  - `callback` (Function): Async function to execute
- **Returns:** Promise<void>
- **Behavior:** Instant mode executes immediately

##### `CHANGES.clear(desc)`
Removes a queued change.

- **Parameters:**
  - `desc` (String): Change descriptor
- **Returns:** void

##### `CHANGES.commit()`
Commits all queued changes to keyboard.

- **Returns:** Promise<void>
- **Side Effects:** Updates BASE_KBINFO, clears queue

### ACTION Event System

Centralized event handling framework.

#### Methods

##### `ACTION.onclick(selector, callback)`
Registers click handler for selector.

- **Parameters:**
  - `selector` (String): CSS selector
  - `callback` (Function): Handler function(element)
- **Returns:** void

##### `ACTION.on(name, callback)`
Registers named event handler.

- **Parameters:**
  - `name` (String): Event name
  - `callback` (Function): Handler function
- **Returns:** void

##### `ACTION.trigger(name, ...args)`
Triggers named event.

- **Parameters:**
  - `name` (String): Event name
  - `args` (Any): Arguments to pass
- **Returns:** void

### KEY Module

Key code parsing and manipulation.

#### Methods

##### `KEY.parse(keystr)`
Parses key string to key mask.

- **Parameters:**
  - `keystr` (String): Key string (e.g., "LCTL(KC_C)")
- **Returns:** Number (16-bit key mask)

##### `KEY.stringify(keymask)`
Converts key mask to string.

- **Parameters:**
  - `keymask` (Number): 16-bit key mask
- **Returns:** String

##### `KEY.validate(keystr)`
Validates key string format.

- **Parameters:**
  - `keystr` (String): Key string to validate
- **Returns:** Boolean

## UI Components API

### Initializer System

#### Functions

##### `addInitializer(type, callback, order)`
Registers initialization callback.

- **Parameters:**
  - `type` (String): 'load' or 'connected'
  - `callback` (Function): Initialization function
  - `order` (Number): Execution order (optional)
- **Returns:** void

### Global UI Functions

##### `updateAll()`
Updates all UI components with current KBINFO.

- **Returns:** void

##### `bindKey(element)`
Opens key binding interface.

- **Parameters:**
  - `element` (HTMLElement): Key element
- **Returns:** void

## File I/O API

### Import Functions

##### `importVil(arrayBuffer)`
Imports Vial format file.

- **Parameters:**
  - `arrayBuffer` (ArrayBuffer): File contents
- **Returns:** Object (KBINFO structure)

##### `importSvl(jsonString)`
Imports KeyBard native format.

- **Parameters:**
  - `jsonString` (String): JSON file contents
- **Returns:** Object (KBINFO structure)

### Export Functions

##### `exportVil()`
Exports current state as Vial format.

- **Returns:** ArrayBuffer

##### `exportSvl()`
Exports current state as KeyBard format.

- **Returns:** String (JSON)

## Vial Protocol API

### USB Communication

##### `VIAL.connect()`
Initiates USB device connection.

- **Returns:** Promise<Boolean>

##### `VIAL.disconnect()`
Disconnects USB device.

- **Returns:** Promise<void>

##### `VIAL.isConnected()`
Checks connection status.

- **Returns:** Boolean

### Protocol Commands

##### `VIAL.getKeyboardId()`
Gets keyboard identification.

- **Returns:** Promise<Object>

##### `VIAL.getKeyboardDefinition()`
Gets keyboard layout definition.

- **Returns:** Promise<Object>

##### `VIAL.getLayer(layer)`
Gets complete layer keymap.

- **Parameters:**
  - `layer` (Number): Layer index
- **Returns:** Promise<Array>

##### `VIAL.setKey(layer, row, col, keymask)`
Sets individual key.

- **Parameters:**
  - `layer` (Number): Layer index
  - `row` (Number): Matrix row
  - `col` (Number): Matrix column
  - `keymask` (Number): Key code
- **Returns:** Promise<void>

## Utility Functions

### DOM Helpers

##### `find(selector)`
Finds single element.

- **Parameters:**
  - `selector` (String): CSS selector
- **Returns:** HTMLElement or null

##### `findAll(selector)`
Finds all matching elements.

- **Parameters:**
  - `selector` (String): CSS selector
- **Returns:** NodeList

##### `createElement(tag, attributes, children)`
Creates DOM element.

- **Parameters:**
  - `tag` (String): HTML tag name
  - `attributes` (Object): Attributes to set
  - `children` (Array): Child elements
- **Returns:** HTMLElement

### Storage Functions

##### `getSaved(key, defaultValue)`
Gets saved preference.

- **Parameters:**
  - `key` (String): Storage key
  - `defaultValue` (Any): Default if not found
- **Returns:** Any

##### `setSaved(key, value)`
Saves preference.

- **Parameters:**
  - `key` (String): Storage key
  - `value` (Any): Value to save
- **Returns:** void

## Event Names

Standard events triggered by ACTION system:

- **`bind`**: Key binding requested
- **`bound`**: Key binding completed
- **`commit`**: Changes committed
- **`connected`**: Device connected
- **`disconnected`**: Device disconnected
- **`loaded`**: Page fully loaded
- **`update`**: UI update needed

## Key String Format

### Basic Keys
- `KC_A` - `KC_Z`: Letters
- `KC_1` - `KC_0`: Numbers
- `KC_F1` - `KC_F24`: Function keys
- `KC_ENT`, `KC_ESC`, `KC_BSPC`, `KC_TAB`: Common keys
- `KC_SPC`: Space
- `KC_MINS`, `KC_EQL`, `KC_LBRC`, `KC_RBRC`: Symbols

### Modifiers
- `LCTL()`, `RCTL()`: Control
- `LSFT()`, `RSFT()`: Shift
- `LALT()`, `RALT()`: Alt
- `LGUI()`, `RGUI()`: GUI/Windows/Command

### Modifier Combinations
- `LCTL(KC_C)`: Ctrl+C
- `LSFT(KC_A)`: Shift+A
- `LCTL(LSFT(KC_Z))`: Ctrl+Shift+Z

### Special Keys
- `MO(n)`: Momentary layer n
- `TG(n)`: Toggle layer n
- `OSL(n)`: One-shot layer n
- `TD(n)`: Tap dance n
- `MACRO(n)`: Macro n

### Custom Keys
- `USER(n)`: User-defined key n
- `CUSTOM(name)`: Named custom key