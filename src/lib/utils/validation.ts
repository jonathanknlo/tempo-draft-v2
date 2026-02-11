/**
 * Validate player name
 */
export function validatePlayerName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  
  if (!trimmed) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (trimmed.length < 1 || trimmed.length > 30) {
    return { valid: false, error: 'Name must be between 1 and 30 characters' };
  }
  
  return { valid: true };
}

/**
 * Check if game time is family-friendly (before 6 PM local time)
 * Uses Toronto timezone (America/Toronto)
 */
export function isFamilyFriendly(gameTime: string): boolean {
  const [hours] = gameTime.split(':').map(Number);
  return hours < 18; // Before 6 PM
}
