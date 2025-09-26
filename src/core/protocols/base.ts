/**
 * Base protocol schemas and utilities
 */

import { z } from 'zod';
import { Result, ok, err } from '@/types/index';

/**
 * Base USB message structure
 */
export const USBMessageSchema = z.object({
  command: z.number().int().min(0).max(255),
  data: z.instanceof(ArrayBuffer),
  length: z.number().int().min(0),
});

export type USBMessage = z.infer<typeof USBMessageSchema>;

/**
 * USB request message
 */
export const USBRequestSchema = z.object({
  command: z.number().int().min(0).max(255),
  value: z.number().int().optional(),
  index: z.number().int().optional(),
  data: z.instanceof(ArrayBuffer).optional(),
});

export type USBRequest = z.infer<typeof USBRequestSchema>;

/**
 * USB response message
 */
export const USBResponseSchema = z.object({
  command: z.number().int().min(0).max(255),
  status: z.enum(['success', 'error', 'timeout']),
  data: z.instanceof(ArrayBuffer).optional(),
  error: z.string().optional(),
});

export type USBResponse = z.infer<typeof USBResponseSchema>;

/**
 * Protocol version information
 */
export const ProtocolVersionSchema = z.object({
  via: z.number().int().min(0),
  vial: z.number().int().min(0),
});

export type ProtocolVersion = z.infer<typeof ProtocolVersionSchema>;

/**
 * Device information
 */
export const DeviceInfoSchema = z.object({
  vendorId: z.number().int(),
  productId: z.number().int(),
  productName: z.string().optional(),
  manufacturerName: z.string().optional(),
  serialNumber: z.string().optional(),
  protocolVersion: ProtocolVersionSchema,
});

export type DeviceInfo = z.infer<typeof DeviceInfoSchema>;

/**
 * Validate data against a schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, string> {
  const result = schema.safeParse(data);

  if (result.success) {
    return ok(result.data);
  } else {
    const errors = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    return err(`Validation failed: ${errors}`);
  }
}

/**
 * Create a validated message
 */
export function createMessage<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Result<T, string> {
  return validate(schema, data);
}

/**
 * Parse binary data with validation
 */
export function parseBinaryMessage(
  buffer: ArrayBuffer,
  expectedCommand?: number
): Result<USBMessage, string> {
  if (buffer.byteLength < 1) {
    return err('Buffer too small');
  }

  const view = new DataView(buffer);
  const command = view.getUint8(0);

  console.log('Parsing response - Command:', command, 'Expected:', expectedCommand, 'Buffer size:', buffer.byteLength);
  console.log('First 10 bytes:', Array.from(new Uint8Array(buffer).slice(0, 10)));

  if (expectedCommand !== undefined && command !== expectedCommand) {
    return err(`Expected command ${expectedCommand}, got ${command}`);
  }

  const message: USBMessage = {
    command,
    data: buffer.slice(1),
    length: buffer.byteLength - 1,
  };

  return validate(USBMessageSchema, message);
}

/**
 * Serialize message to binary
 */
export function serializeMessage(message: USBRequest): ArrayBuffer {
  // QMK/Vial raw HID expects 32 byte packets
  const RAW_HID_PACKET_SIZE = 32;

  const headerSize = 1; // command byte
  const valueSize = message.value !== undefined ? 4 : 0;
  const indexSize = message.index !== undefined ? 4 : 0;
  const dataSize = message.data ? message.data.byteLength : 0;

  // Create buffer with fixed size for raw HID
  const buffer = new ArrayBuffer(RAW_HID_PACKET_SIZE);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  // Initialize buffer with zeros
  uint8View.fill(0);

  let offset = 0;

  // Write command
  view.setUint8(offset, message.command);
  offset += 1;

  // Write value if present
  if (message.value !== undefined) {
    view.setUint32(offset, message.value, true); // little-endian
    offset += 4;
  }

  // Write index if present
  if (message.index !== undefined) {
    view.setUint32(offset, message.index, true); // little-endian
    offset += 4;
  }

  // Write data if present
  if (message.data && offset < RAW_HID_PACKET_SIZE) {
    const dataView = new Uint8Array(buffer, offset);
    const sourceView = new Uint8Array(message.data);
    const copySize = Math.min(sourceView.length, RAW_HID_PACKET_SIZE - offset);
    dataView.set(sourceView.subarray(0, copySize));
  }

  return buffer;
}