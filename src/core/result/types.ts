/**
 * Result type for error handling without exceptions
 */

export type Result<T, E = Error> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly ok = true as const;
  readonly err = false as const;

  constructor(public readonly value: T) {}

  isOk(): this is Ok<T> {
    return true;
  }

  isErr(): this is Err<never> {
    return false;
  }

  unwrap(): T {
    return this.value;
  }

  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  unwrapOrElse(fn: (error: never) => T): T {
    return this.value;
  }

  map<U>(fn: (value: T) => U): Result<U, never> {
    return new Ok(fn(this.value));
  }

  mapErr<F>(fn: (error: never) => F): Result<T, F> {
    return this as Result<T, F>;
  }

  chain<U, F>(fn: (value: T) => Result<U, F>): Result<U, F> {
    return fn(this.value);
  }

  recover<U>(fn: (error: never) => Result<T | U, never>): Result<T | U, never> {
    return this;
  }

  match<U>(handlers: { ok: (value: T) => U; err: (error: never) => U }): U {
    return handlers.ok(this.value);
  }
}

export class Err<E> {
  readonly ok = false as const;
  readonly err = true as const;

  constructor(public readonly error: E) {}

  isOk(): this is Ok<never> {
    return false;
  }

  isErr(): this is Err<E> {
    return true;
  }

  unwrap(): never {
    throw new Error(`Attempted to unwrap an Err: ${this.error}`);
  }

  unwrapOr<T>(defaultValue: T): T {
    return defaultValue;
  }

  unwrapOrElse<T>(fn: (error: E) => T): T {
    return fn(this.error);
  }

  map<U>(fn: (value: never) => U): Result<U, E> {
    return this as Result<U, E>;
  }

  mapErr<F>(fn: (error: E) => F): Result<never, F> {
    return new Err(fn(this.error));
  }

  chain<U, F>(fn: (value: never) => Result<U, F>): Result<U, F> {
    return this as unknown as Result<U, F>;
  }

  recover<U, F>(fn: (error: E) => Result<U, F>): Result<U, F> {
    return fn(this.error);
  }

  match<U>(handlers: { ok: (value: never) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
  }
}

// Helper functions
export function ok<T>(value: T): Ok<T> {
  return new Ok(value);
}

export function err<E>(error: E): Err<E> {
  return new Err(error);
}

// Type guards
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok === true;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result.err === true;
}

// Async Result type
export type ResultAsync<T, E = Error> = Promise<Result<T, E>>;

// Utility functions for working with Results
export async function wrapAsync<T, E = Error>(
  promise: Promise<T>
): ResultAsync<T, E> {
  try {
    const value = await promise;
    return ok(value);
  } catch (error) {
    return err(error as E);
  }
}

export function wrapSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn());
  } catch (error) {
    return err(error as E);
  }
}

// Combine multiple results
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isErr()) {
      return err(result.error);
    }
    values.push(result.value);
  }

  return ok(values);
}

export function combineAsync<T, E>(
  results: ResultAsync<T, E>[]
): ResultAsync<T[], E> {
  return Promise.all(results).then(combine);
}