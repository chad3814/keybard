import React from 'react';
import { QMK_SETTINGS } from '../constants/qmk-settings';
import type { KeyboardInfo } from '../types/vial.types';

interface QMKSettingsProps {
  keyboard: KeyboardInfo;
}

export const QMKSettings: React.FC<QMKSettingsProps> = ({ keyboard }) => {
  if (!keyboard.settings) {
    return <div>No QMK settings available</div>;
  }

  const getBitValue = (qsid: number, bit: number): boolean => {
    const value = keyboard.settings![qsid] || 0;
    return ((value >> bit) & 1) === 1;
  };

  const getIntValue = (qsid: number): number => {
    return keyboard.settings![qsid] || 0;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>QMK Settings</h2>
      {QMK_SETTINGS.tabs.map((tab, tabIdx) => (
        <div key={tabIdx} style={{ marginBottom: '30px' }}>
          <h3>{tab.name}</h3>
          <div style={{ marginLeft: '20px' }}>
            {tab.fields.map((field, fieldIdx) => (
              <div key={fieldIdx} style={{ marginBottom: '10px' }}>
                {field.type === 'boolean' ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={getBitValue(field.qsid, field.bit)}
                      readOnly
                    />
                    <span>{field.title}</span>
                  </label>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>
                      {field.title}
                    </label>
                    <input
                      type="number"
                      value={getIntValue(field.qsid)}
                      min={field.min}
                      max={field.max}
                      readOnly
                      style={{ width: '100px' }}
                    />
                    <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                      (Range: {field.min} - {field.max})
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
