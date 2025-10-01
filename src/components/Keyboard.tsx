import React, { useState } from 'react';
import { Key } from './Key';
import { SVALBOARD_LAYOUT, UNIT_SIZE, MATRIX_COLS } from '../constants/svalboard-layout';
import { KEYMAP } from '../constants/keygen';
import { keyService } from '../services/key.service';
import { svalService } from '../services/sval.service';
import type { KeyboardInfo } from '../types/vial.types';
import './Keyboard.css';

interface KeyboardProps {
  keyboard: KeyboardInfo;
  onKeyClick?: (layer: number, row: number, col: number) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ keyboard, onKeyClick }) => {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [selectedKey, setSelectedKey] = useState<{ row: number; col: number } | null>(null);

  // Get the keymap for the selected layer
  const layerKeymap = keyboard.keymap?.[selectedLayer] || [];

  // Convert HSV to RGB for CSS color
  const hsvToRgb = (h: number, s: number, v: number): string => {
    // HSV values are typically 0-255, normalize them
    h = (h / 255) * 360;  // Convert to degrees
    s = s / 255;           // Convert to 0-1
    v = v / 255;           // Convert to 0-1

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Get layer color for current layer
  const getLayerColor = (layerIndex: number): string => {
    if (keyboard.layer_colors && keyboard.layer_colors[layerIndex]) {
      const { hue, sat, val } = keyboard.layer_colors[layerIndex];
      return hsvToRgb(hue, sat, val);
    }
    return '#888'; // Default gray color
  };

  // Get label for a keycode
  const getKeyLabel = (keycode: number): string => {
    // First get the string representation (e.g., "KC_C" or "LCA(KC_NO)")
    const keyString = keyService.stringify(keycode);

    // If it's a simple key (no modifiers), look it up in KEYMAP
    if (KEYMAP[keyString]) {
      return KEYMAP[keyString].str || keyString;
    }

    // For modifier combinations, try to parse and get the base key
    // Check if it's a modifier combination like "LCA(KC_NO)"
    const modifierMatch = keyString.match(/^([A-Z]+)\((KC_[A-Z0-9_]+)\)$/);
    if (modifierMatch) {
      const modifier = modifierMatch[1];
      const baseKey = modifierMatch[2];
      if (KEYMAP[baseKey]) {
        const baseStr = KEYMAP[baseKey].str || baseKey;
        // If base string is empty (like KC_NO), just show the modifier
        if (!baseStr) {
          return modifier;
        }
        return `${modifier}(${baseStr})`;
      }
    }

    // Fallback to the string representation
    return keyString;
  };

  // Get keycode name for data attribute
  const getKeycodeName = (keycode: number): string => {
    return keyService.stringify(keycode);
  };

  const handleKeyClick = (row: number, col: number) => {
    setSelectedKey({ row, col });
    if (onKeyClick) {
      onKeyClick(selectedLayer, row, col);
    }
  };

  // Calculate the keyboard dimensions for the container
  const calculateKeyboardSize = () => {
    let maxX = 0;
    let maxY = 0;

    Object.values(SVALBOARD_LAYOUT).forEach(key => {
      maxX = Math.max(maxX, key.x + key.w);
      maxY = Math.max(maxY, key.y + key.h);
    });

    return {
      width: maxX * UNIT_SIZE,
      height: maxY * UNIT_SIZE
    };
  };

  const { width, height } = calculateKeyboardSize();

  return (
    <div className="keyboard-container">
      <div className="layer-selector">
        <label htmlFor="layer-select">Layer:</label>
        <div className="layer-color-indicator" style={{ backgroundColor: getLayerColor(selectedLayer) }} />
        <select
          id="layer-select"
          value={selectedLayer}
          onChange={(e) => setSelectedLayer(Number(e.target.value))}
          className="layer-select"
        >
          {Array.from({ length: keyboard.layers || 16 }, (_, i) => (
            <option key={i} value={i}>
              {svalService.getLayerName(keyboard, i)}
            </option>
          ))}
        </select>
      </div>

      <div
        className="keyboard-layout"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {Object.entries(SVALBOARD_LAYOUT).map(([matrixPos, layout]) => {
          const pos = Number(matrixPos);
          const row = Math.floor(pos / MATRIX_COLS);
          const col = pos % MATRIX_COLS;

          // Get the keycode for this position in the current layer
          const keycode = layerKeymap[pos] || 0;
          const label = getKeyLabel(keycode);
          const keycodeName = getKeycodeName(keycode);

          return (
            <Key
              key={`${row}-${col}`}
              x={layout.x}
              y={layout.y}
              w={layout.w}
              h={layout.h}
              keycode={keycodeName}
              label={label}
              row={row}
              col={col}
              selected={selectedKey?.row === row && selectedKey?.col === col}
              onClick={handleKeyClick}
            />
          );
        })}
      </div>

      {selectedKey && (
        <div className="key-info">
          <h4>Selected Key</h4>
          <p>Position: Row {selectedKey.row}, Col {selectedKey.col}</p>
          <p>Matrix: {selectedKey.row * MATRIX_COLS + selectedKey.col}</p>
          <p>Keycode: {getKeycodeName(layerKeymap[selectedKey.row * MATRIX_COLS + selectedKey.col] || 0)}</p>
        </div>
      )}
    </div>
  );
};