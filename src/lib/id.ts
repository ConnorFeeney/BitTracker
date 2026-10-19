let sequence = 0;

/** IDs are local IndexedDB keys; they do not need cryptographic randomness. */
export function createId(): string {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}-${Math.random().toString(36).slice(2)}`;
}
