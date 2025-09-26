/**
 * QMK protocol schemas and utilities
 */

import { z } from 'zod';
import { Result, ok, err } from '@/types/index';
import {
  USBRequestSchema,
  USBResponseSchema,
  validate,
  serializeMessage,
  parseBinaryMessage
} from '@core/protocols/base';

/**
 * QMK command codes
 */
export enum QmkCommand {
  GET_PROTOCOL_VERSION = 0x01,
  GET_KEYBOARD_VALUE = 0x02,
  SET_KEYBOARD_VALUE = 0x03,
  DYNAMIC_KEYMAP_GET_KEYCODE = 0x04,
  DYNAMIC_KEYMAP_SET_KEYCODE = 0x05,
  DYNAMIC_KEYMAP_RESET = 0x06,
  LIGHTING_SET_VALUE = 0x07,
  LIGHTING_GET_VALUE = 0x08,
  LIGHTING_SAVE = 0x09,
  EEPROM_RESET = 0x0A,
  BOOTLOADER_JUMP = 0x0B,
  DYNAMIC_KEYMAP_MACRO_GET_COUNT = 0x0C,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE = 0x0D,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER = 0x0E,
  DYNAMIC_KEYMAP_MACRO_SET_BUFFER = 0x0F,
  DYNAMIC_KEYMAP_MACRO_RESET = 0x10,
  DYNAMIC_KEYMAP_GET_LAYER_COUNT = 0x11,
  DYNAMIC_KEYMAP_GET_BUFFER = 0x12,
  DYNAMIC_KEYMAP_SET_BUFFER = 0x13,
  DYNAMIC_KEYMAP_GET_ENCODER = 0x14,
  DYNAMIC_KEYMAP_SET_ENCODER = 0x15,
}

/**
 * QMK setting IDs
 */
export enum QmkSettingId {
  TAPPING_TERM = 0x01,
  TAPPING_TOGGLE = 0x02,
  PERMISSIVE_HOLD = 0x03,
  HOLD_ON_OTHER_KEY_PRESS = 0x04,
  RETRO_TAPPING = 0x05,
  COMBO_TERM = 0x06,
  TAP_CODE_DELAY = 0x07,
  TAP_HOLD_CAPS_DELAY = 0x08,
  AUTO_SHIFT_TIMEOUT = 0x09,
  AUTO_SHIFT_ENABLED = 0x0A,
  AUTO_SHIFT_MODIFIERS = 0x0B,
  ONESHOT_TIMEOUT = 0x0C,
  ONESHOT_TAP_TOGGLE = 0x0D,
  MOUSEKEY_DELAY = 0x0E,
  MOUSEKEY_INTERVAL = 0x0F,
  MOUSEKEY_MAX_SPEED = 0x10,
  MOUSEKEY_TIME_TO_MAX = 0x11,
  MOUSEKEY_WHEEL_DELAY = 0x12,
}

/**
 * QMK setting value schema
 */
export const QmkSettingValueSchema = z.union([
  z.number().int().min(0).max(65535),
  z.boolean(),
]);

export type QmkSettingValue = z.infer<typeof QmkSettingValueSchema>;

/**
 * QMK get setting request
 */
export const QmkGetSettingRequestSchema = z.object({
  command: z.literal(QmkCommand.GET_KEYBOARD_VALUE),
  settingId: z.nativeEnum(QmkSettingId),
});

export type QmkGetSettingRequest = z.infer<typeof QmkGetSettingRequestSchema>;

/**
 * QMK set setting request
 */
export const QmkSetSettingRequestSchema = z.object({
  command: z.literal(QmkCommand.SET_KEYBOARD_VALUE),
  settingId: z.nativeEnum(QmkSettingId),
  value: QmkSettingValueSchema,
});

export type QmkSetSettingRequest = z.infer<typeof QmkSetSettingRequestSchema>;

/**
 * QMK setting response
 */
export const QmkSettingResponseSchema = z.object({
  command: z.union([
    z.literal(QmkCommand.GET_KEYBOARD_VALUE),
    z.literal(QmkCommand.SET_KEYBOARD_VALUE),
  ]),
  settingId: z.nativeEnum(QmkSettingId),
  value: QmkSettingValueSchema,
  success: z.boolean(),
});

export type QmkSettingResponse = z.infer<typeof QmkSettingResponseSchema>;

/**
 * QMK keymap request schemas
 */
export const QmkGetKeycodeRequestSchema = z.object({
  command: z.literal(QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE),
  layer: z.number().int().min(0).max(31),
  row: z.number().int().min(0).max(255),
  column: z.number().int().min(0).max(255),
});

export type QmkGetKeycodeRequest = z.infer<typeof QmkGetKeycodeRequestSchema>;

export const QmkSetKeycodeRequestSchema = z.object({
  command: z.literal(QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE),
  layer: z.number().int().min(0).max(31),
  row: z.number().int().min(0).max(255),
  column: z.number().int().min(0).max(255),
  keycode: z.number().int().min(0).max(65535),
});

export type QmkSetKeycodeRequest = z.infer<typeof QmkSetKeycodeRequestSchema>;

/**
 * QMK keycode response
 */
export const QmkKeycodeResponseSchema = z.object({
  command: z.union([
    z.literal(QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE),
    z.literal(QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE),
  ]),
  layer: z.number().int().min(0).max(31),
  row: z.number().int().min(0).max(255),
  column: z.number().int().min(0).max(255),
  keycode: z.number().int().min(0).max(65535),
  success: z.boolean(),
});

export type QmkKeycodeResponse = z.infer<typeof QmkKeycodeResponseSchema>;

/**
 * Create a QMK get setting request
 */
export function createGetSettingRequest(
  settingId: QmkSettingId
): Result<ArrayBuffer, string> {
  const request: QmkGetSettingRequest = {
    command: QmkCommand.GET_KEYBOARD_VALUE,
    settingId,
  };

  const validated = validate(QmkGetSettingRequestSchema, request);
  if (!validated.isOk()) {
    return err(validated.error);
  }

  const buffer = serializeMessage({
    command: QmkCommand.GET_KEYBOARD_VALUE,
    index: settingId,
  });

  return ok(buffer);
}

/**
 * Create a QMK set setting request
 */
export function createSetSettingRequest(
  settingId: QmkSettingId,
  value: QmkSettingValue
): Result<ArrayBuffer, string> {
  const request: QmkSetSettingRequest = {
    command: QmkCommand.SET_KEYBOARD_VALUE,
    settingId,
    value,
  };

  const validated = validate(QmkSetSettingRequestSchema, request);
  if (!validated.isOk()) {
    return err(validated.error);
  }

  // Convert boolean to number for protocol
  const numericValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;

  const buffer = serializeMessage({
    command: QmkCommand.SET_KEYBOARD_VALUE,
    index: settingId,
    value: numericValue,
  });

  return ok(buffer);
}

/**
 * Parse a QMK setting response
 */
export function parseSettingResponse(
  buffer: ArrayBuffer
): Result<QmkSettingResponse, string> {
  const parsed = parseBinaryMessage(buffer);
  if (!parsed.isOk()) {
    return err(parsed.error);
  }

  const message = parsed.value;
  const view = new DataView(message.data);

  console.log('Setting response - Command:', message.command, 'Data length:', message.data.byteLength);

  // Some keyboards use different response command codes, so we'll be flexible
  // if (message.command !== QmkCommand.GET_KEYBOARD_VALUE &&
  //     message.command !== QmkCommand.SET_KEYBOARD_VALUE) {
  //   return err(`Unexpected command: ${message.command}`);
  // }

  if (message.data.byteLength < 5) {
    return err('Response too short');
  }

  const settingId = view.getUint8(0);
  const rawValue = view.getUint32(1, true); // little-endian

  // Determine if this is a boolean setting based on ID
  const booleanSettings = [
    QmkSettingId.PERMISSIVE_HOLD,
    QmkSettingId.HOLD_ON_OTHER_KEY_PRESS,
    QmkSettingId.RETRO_TAPPING,
    QmkSettingId.AUTO_SHIFT_ENABLED,
    QmkSettingId.AUTO_SHIFT_MODIFIERS,
  ];

  const value = booleanSettings.includes(settingId as QmkSettingId)
    ? rawValue !== 0
    : rawValue;

  const response: QmkSettingResponse = {
    command: message.command as QmkCommand.GET_KEYBOARD_VALUE | QmkCommand.SET_KEYBOARD_VALUE,
    settingId: settingId as QmkSettingId,
    value,
    success: true,
  };

  return validate(QmkSettingResponseSchema, response);
}

/**
 * Create a QMK get keycode request
 */
export function createGetKeycodeRequest(
  layer: number,
  row: number,
  column: number
): Result<ArrayBuffer, string> {
  const request: QmkGetKeycodeRequest = {
    command: QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE,
    layer,
    row,
    column,
  };

  const validated = validate(QmkGetKeycodeRequestSchema, request);
  if (!validated.isOk()) {
    return err(validated.error);
  }

  // Pack layer, row, column into index
  const index = (layer << 16) | (row << 8) | column;

  const buffer = serializeMessage({
    command: QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE,
    index,
  });

  return ok(buffer);
}

/**
 * Create a QMK set keycode request
 */
export function createSetKeycodeRequest(
  layer: number,
  row: number,
  column: number,
  keycode: number
): Result<ArrayBuffer, string> {
  const request: QmkSetKeycodeRequest = {
    command: QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE,
    layer,
    row,
    column,
    keycode,
  };

  const validated = validate(QmkSetKeycodeRequestSchema, request);
  if (!validated.isOk()) {
    return err(validated.error);
  }

  // Pack layer, row, column into index
  const index = (layer << 16) | (row << 8) | column;

  const buffer = serializeMessage({
    command: QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE,
    index,
    value: keycode,
  });

  return ok(buffer);
}

/**
 * Parse a QMK keycode response
 */
export function parseKeycodeResponse(
  buffer: ArrayBuffer,
  layer: number,
  row: number,
  column: number
): Result<QmkKeycodeResponse, string> {
  const parsed = parseBinaryMessage(buffer);
  if (!parsed.isOk()) {
    return err(parsed.error);
  }

  const message = parsed.value;
  const view = new DataView(message.data);

  if (message.command !== QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE &&
      message.command !== QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE) {
    return err(`Unexpected command: ${message.command}`);
  }

  if (message.data.byteLength < 2) {
    return err('Response too short');
  }

  const keycode = view.getUint16(0, true); // little-endian

  const response: QmkKeycodeResponse = {
    command: message.command as QmkCommand.DYNAMIC_KEYMAP_GET_KEYCODE | QmkCommand.DYNAMIC_KEYMAP_SET_KEYCODE,
    layer,
    row,
    column,
    keycode,
    success: true,
  };

  return validate(QmkKeycodeResponseSchema, response);
}

/**
 * Get QMK protocol version request
 */
export function createGetProtocolVersionRequest(): ArrayBuffer {
  return serializeMessage({
    command: QmkCommand.GET_PROTOCOL_VERSION,
  });
}

/**
 * Parse protocol version response
 */
export function parseProtocolVersionResponse(
  buffer: ArrayBuffer
): Result<{ via: number; vial: number }, string> {
  // Don't validate the command byte - some keyboards respond with different command codes
  const parsed = parseBinaryMessage(buffer);
  if (!parsed.isOk()) {
    return err(parsed.error);
  }

  const message = parsed.value;
  console.log('Protocol version response - Command:', message.command, 'Data length:', message.data.byteLength);

  if (message.data.byteLength < 4) {
    return err('Protocol version response too short');
  }

  const view = new DataView(message.data);
  const via = view.getUint16(0, true); // little-endian
  const vial = view.getUint16(2, true); // little-endian

  console.log('Protocol versions - VIA:', via, 'VIAL:', vial);

  return ok({ via, vial });
}