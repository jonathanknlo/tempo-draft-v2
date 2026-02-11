import { writable, derived } from 'svelte/store';
import type { Room, Player, Game, Pick } from '$lib/supabase/types';

// Room state
export const roomStore = writable<Room | null>(null);
export const roomError = writable<string | null>(null);

// Players state
export const playersStore = writable<Player[]>([]);
export const myPlayerStore = derived(
  playersStore,
  ($players) => $players.find((p) => p.session_id !== null)
);
export const opponentStore = derived(
  playersStore,
  ($players) => $players.find((p) => p.session_id === null || !p.session_id)
);

// Draft state
interface DraftState {
  games: Game[];
  picks: Pick[];
  isMyTurn: boolean;
  availableGames: Game[];
  myGames: Game[];
  opponentGames: Game[];
  canUndo: boolean;
  undoDeadline: number | null;
  lastPickId: string | null;
}

export const draftStore = writable<DraftState>({
  games: [],
  picks: [],
  isMyTurn: false,
  availableGames: [],
  myGames: [],
  opponentGames: [],
  canUndo: false,
  undoDeadline: null,
  lastPickId: null
});

// UI state
interface UIState {
  selectedGameId: string | null;
  showShareModal: boolean;
  showUndoToast: boolean;
  isCoinTossing: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  coinTossResult: 'heads' | 'tails' | null;
  coinTossWinner: Player | null;
}

export const uiStore = writable<UIState>({
  selectedGameId: null,
  showShareModal: false,
  showUndoToast: false,
  isCoinTossing: false,
  connectionStatus: 'connecting',
  coinTossResult: null,
  coinTossWinner: null
});

// Derived stores for computed values
export const currentPickNumber = derived(
  draftStore,
  ($draft) => $draft.picks.filter((p) => p.undone_at === null).length + 1
);

export const isDraftComplete = derived(
  draftStore,
  ($draft) => {
    const validPicks = $draft.picks.filter((p) => p.undone_at === null);
    return validPicks.length >= 18;
  }
);

export const myGameCount = derived(
  draftStore,
  ($draft) => $draft.myGames.length
);

export const opponentGameCount = derived(
  draftStore,
  ($draft) => $draft.opponentGames.length
);
