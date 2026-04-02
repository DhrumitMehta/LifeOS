let activeUserId: string | null = null;

export function setActiveUserId(id: string | null): void {
  activeUserId = id;
}

export function getActiveUserId(): string | null {
  return activeUserId;
}

/** AsyncStorage key for the signed-in user's data (habits, journal, finance, …). */
export function scopedStorageKey(shortKey: string): string {
  const id = activeUserId;
  if (!id) {
    throw new Error('LifeOS: storage requested with no active user');
  }
  return `lifeos_u_${id}_${shortKey}`;
}
