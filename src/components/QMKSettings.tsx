import React from 'react';
import { QMK_SETTINGS } from '../constants/qmk-settings';
import type { KeyboardInfo } from '../types/vial.types';
import './QMKSettings.css';

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
    <div className="qmk-settings">
      <h2>QMK Settings</h2>
      {QMK_SETTINGS.tabs.map((tab, tabIdx) => (
        <div key={tabIdx} className="qmk-settings-tab">
          <h3>{tab.name}</h3>
          <div className="qmk-settings-tab-content">
            {tab.fields.map((field, fieldIdx) => (
              <div key={fieldIdx} className="qmk-settings-field">
                {field.type === 'boolean' ? (
                  <label className="qmk-settings-checkbox-label">
                    <input
                      type="checkbox"
                      checked={getBitValue(field.qsid, field.bit)}
                      readOnly
                    />
                    <span>{field.title}</span>
                  </label>
                ) : (
                  <div>
                    <label className="qmk-settings-number-label" htmlFor={`qmk-setting-${field.qsid}`}>
                      {field.title}
                    </label>
                    <input
                      type="number"
                      value={getIntValue(field.qsid)}
                      min={field.min}
                      max={field.max}
                      readOnly
                      className="qmk-settings-number-input"
                      id={`qmk-setting-${field.qsid}`}
                    />
                    <span className="qmk-settings-range-hint">
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
