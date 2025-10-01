import type { QMKSettings, QMKSettingsTab, QMKSettingsField } from '../../src/types/qmk';
import type { QMKSettingsFactory } from './types';

// Minimal QMK settings
export const minimalQMKSettings: QMKSettings = {
  tabs: [
    {
      name: 'Basic',
      fields: [
        {
          type: 'boolean',
          title: 'Enable Feature',
          qsid: 0,
          bit: 0,
          width: 1
        }
      ]
    }
  ]
};

// Typical QMK settings with common features
export const typicalQMKSettings: QMKSettings = {
  tabs: [
    {
      name: 'General',
      fields: [
        {
          type: 'boolean',
          title: 'Auto Shift',
          qsid: 0,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Auto Shift Timeout',
          qsid: 1,
          min: 100,
          max: 5000,
          width: 16
        },
        {
          type: 'boolean',
          title: 'Combo Enable',
          qsid: 2,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Combo Term',
          qsid: 3,
          min: 10,
          max: 500,
          width: 16
        }
      ]
    },
    {
      name: 'Tap Dance',
      fields: [
        {
          type: 'boolean',
          title: 'Tap Dance Enable',
          qsid: 4,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Tapping Term',
          qsid: 5,
          min: 100,
          max: 1000,
          width: 16
        },
        {
          type: 'boolean',
          title: 'Permissive Hold',
          qsid: 6,
          bit: 0,
          width: 1
        }
      ]
    },
    {
      name: 'Mouse Keys',
      fields: [
        {
          type: 'boolean',
          title: 'Mouse Keys Enable',
          qsid: 7,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Mouse Delay',
          qsid: 8,
          min: 0,
          max: 255,
          width: 8
        },
        {
          type: 'integer',
          title: 'Mouse Interval',
          qsid: 9,
          min: 0,
          max: 255,
          width: 8
        },
        {
          type: 'integer',
          title: 'Mouse Max Speed',
          qsid: 10,
          min: 1,
          max: 255,
          width: 8
        }
      ]
    }
  ]
};

// Complex QMK settings with all features
export const complexQMKSettings: QMKSettings = {
  tabs: [
    {
      name: 'Core',
      fields: [
        {
          type: 'boolean',
          title: 'NKRO',
          qsid: 0,
          bit: 0,
          width: 1
        },
        {
          type: 'boolean',
          title: 'One Shot Keys',
          qsid: 1,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'One Shot Timeout',
          qsid: 2,
          min: 100,
          max: 10000,
          width: 16
        },
        {
          type: 'boolean',
          title: 'Grave Escape Enable',
          qsid: 3,
          bit: 0,
          width: 1
        }
      ]
    },
    {
      name: 'Layers',
      fields: [
        {
          type: 'integer',
          title: 'Default Layer',
          qsid: 4,
          min: 0,
          max: 31,
          width: 5
        },
        {
          type: 'boolean',
          title: 'Layer Lock Enable',
          qsid: 5,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Layer Lock Timeout',
          qsid: 6,
          min: 0,
          max: 65535,
          width: 16
        }
      ]
    },
    {
      name: 'RGB',
      fields: [
        {
          type: 'boolean',
          title: 'RGB Enable',
          qsid: 7,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'RGB Mode',
          qsid: 8,
          min: 0,
          max: 35,
          width: 6
        },
        {
          type: 'integer',
          title: 'RGB Hue',
          qsid: 9,
          min: 0,
          max: 255,
          width: 8
        },
        {
          type: 'integer',
          title: 'RGB Saturation',
          qsid: 10,
          min: 0,
          max: 255,
          width: 8
        },
        {
          type: 'integer',
          title: 'RGB Value',
          qsid: 11,
          min: 0,
          max: 255,
          width: 8
        },
        {
          type: 'integer',
          title: 'RGB Speed',
          qsid: 12,
          min: 0,
          max: 255,
          width: 8
        }
      ]
    },
    {
      name: 'Advanced',
      fields: [
        {
          type: 'boolean',
          title: 'Debug Enable',
          qsid: 13,
          bit: 0,
          width: 1
        },
        {
          type: 'boolean',
          title: 'Console Enable',
          qsid: 14,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'USB Polling Rate',
          qsid: 15,
          min: 1,
          max: 1000,
          width: 10
        },
        {
          type: 'boolean',
          title: 'Swap Hands Enable',
          qsid: 16,
          bit: 0,
          width: 1
        },
        {
          type: 'integer',
          title: 'Matrix Scan Delay',
          qsid: 17,
          min: 0,
          max: 255,
          width: 8
        }
      ]
    }
  ]
};

// Factory function to create custom QMK settings
export const createTestQMKSettings: QMKSettingsFactory = (overrides = {}) => {
  const base: QMKSettings = {
    tabs: [
      {
        name: 'Test',
        fields: [
          {
            type: 'boolean',
            title: 'Test Feature',
            qsid: 0,
            bit: 0,
            width: 1
          }
        ]
      }
    ]
  };

  if (overrides.tabs) {
    return { tabs: overrides.tabs };
  }

  return { ...base, ...overrides };
};

// Helper to generate QMK settings with specific feature flags
export const generateQMKSettingsWithFeatures = (features: string[]): QMKSettings => {
  const tabs: QMKSettingsTab[] = [];
  let qsid = 0;

  if (features.includes('tapdance')) {
    tabs.push({
      name: 'Tap Dance',
      fields: [
        { type: 'boolean', title: 'Tap Dance Enable', qsid: qsid++, bit: 0, width: 1 },
        { type: 'integer', title: 'Tapping Term', qsid: qsid++, min: 100, max: 1000, width: 16 }
      ]
    });
  }

  if (features.includes('combo')) {
    tabs.push({
      name: 'Combo',
      fields: [
        { type: 'boolean', title: 'Combo Enable', qsid: qsid++, bit: 0, width: 1 },
        { type: 'integer', title: 'Combo Term', qsid: qsid++, min: 10, max: 500, width: 16 }
      ]
    });
  }

  if (features.includes('mousekeys')) {
    tabs.push({
      name: 'Mouse',
      fields: [
        { type: 'boolean', title: 'Mouse Keys', qsid: qsid++, bit: 0, width: 1 },
        { type: 'integer', title: 'Mouse Speed', qsid: qsid++, min: 0, max: 255, width: 8 }
      ]
    });
  }

  if (features.includes('rgb')) {
    tabs.push({
      name: 'RGB',
      fields: [
        { type: 'boolean', title: 'RGB Enable', qsid: qsid++, bit: 0, width: 1 },
        { type: 'integer', title: 'RGB Mode', qsid: qsid++, min: 0, max: 35, width: 6 },
        { type: 'integer', title: 'RGB Brightness', qsid: qsid++, min: 0, max: 255, width: 8 }
      ]
    });
  }

  return { tabs };
};

// Test scenarios for different configurations
export const qmkTestScenarios = {
  disabled: createTestQMKSettings({ tabs: [] }),
  minimal: minimalQMKSettings,
  typical: typicalQMKSettings,
  complex: complexQMKSettings,
  tapDanceOnly: generateQMKSettingsWithFeatures(['tapdance']),
  comboOnly: generateQMKSettingsWithFeatures(['combo']),
  mouseOnly: generateQMKSettingsWithFeatures(['mousekeys']),
  rgbOnly: generateQMKSettingsWithFeatures(['rgb']),
  allFeatures: generateQMKSettingsWithFeatures(['tapdance', 'combo', 'mousekeys', 'rgb'])
};

// Helper to create test setting values
export const createTestSettingValues = (settings: QMKSettings): Record<number, number> => {
  const values: Record<number, number> = {};

  settings.tabs.forEach(tab => {
    tab.fields.forEach(field => {
      if (field.type === 'boolean') {
        values[field.qsid] = Math.random() > 0.5 ? 1 : 0;
      } else if (field.type === 'integer') {
        values[field.qsid] = Math.floor(
          Math.random() * (field.max - field.min) + field.min
        );
      }
    });
  });

  return values;
};

// Export all as a combined fixture
export const qmkSettingsFixtures = {
  minimal: minimalQMKSettings,
  typical: typicalQMKSettings,
  complex: complexQMKSettings,
  createTestQMKSettings,
  generateQMKSettingsWithFeatures,
  createTestSettingValues,
  scenarios: qmkTestScenarios
};