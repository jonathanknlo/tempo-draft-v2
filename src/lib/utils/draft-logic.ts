import type { Player, Pick } from '$lib/supabase/types';

/**
 * Determine whose turn it is based on picks made
 * Uses snake draft: 1-2-2-1-1-2-2-1...
 */
export function getCurrentTurnPlayerId(
  picks: Pick[],
  players: Player[],
  firstPickerId: string
): string | null {
  if (players.length < 2) return null;
  
  const validPicks = picks.filter((p) => p.undone_at === null);
  const pickCount = validPicks.length;
  
  if (pickCount >= 18) return null;
  
  const secondPickerId = players.find((p) => p.id !== firstPickerId)?.id;
  if (!secondPickerId) return null;
  
  // Snake draft pattern
  const round = Math.floor(pickCount / 2);
  const isFirstPickersTurn = round % 2 === 0
    ? pickCount % 2 === 0   // Even rounds: first picker goes first
    : pickCount % 2 === 1;  // Odd rounds: first picker goes second
  
  return isFirstPickersTurn ? firstPickerId : secondPickerId;
}

/**
 * Check if it's the current player's turn
 */
export function isMyTurn(
  myPlayerId: string,
  currentTurnPlayerId: string | null
): boolean {
  return myPlayerId === currentTurnPlayerId;
}

/**
 * Generate a random 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code.toUpperCase();
}

/**
 * Generate a unique session ID for anonymous players
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
