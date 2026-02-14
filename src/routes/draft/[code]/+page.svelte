<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { get } from 'svelte/store';
  import { supabase } from '$lib/supabase/client';
  import { roomStore, playersStore, draftStore, uiStore, myPlayerStore, opponentStore } from '$lib/stores/draft';
  import { notificationStore } from '$lib/stores/notification';
  import { getCurrentTurnPlayerId, generateSessionId } from '$lib/utils/draft-logic';
  import { generateICS, downloadICS } from '$lib/utils/ics-export';
  import TurnIndicator from '$lib/components/TurnIndicator.svelte';
  import DraftBoard from '$lib/components/DraftBoard.svelte';
  import PlayerColumn from '$lib/components/PlayerColumn.svelte';
  import CoinToss from '$lib/components/CoinToss.svelte';
  import ShareLink from '$lib/components/ShareLink.svelte';
  import UndoToast from '$lib/components/UndoToast.svelte';
  import NotificationToast from '$lib/components/NotificationToast.svelte';
  import type { Game, Pick, Player } from '$lib/supabase/types';
  import type { PageData } from './$types';
  
  export let data: PageData;
  
  // Initialize stores with server data
  roomStore.set(data.room);
  playersStore.set(data.players);
  draftStore.set({
    games: data.games,
    picks: data.picks,
    isMyTurn: false,
    availableGames: data.games,
    myGames: [],
    opponentGames: [],
    canUndo: false,
    undoDeadline: null,
    lastPickId: null
  });
  
  // Local state
  let playerName = '';
  let isJoining = false;
  let subscriptions: (() => void)[] = [];
  let undoTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Derived values
  $: room = $roomStore;
  $: players = $playersStore;
  $: myPlayer = $myPlayerStore || data.myPlayer;
  $: opponent = $opponentStore;
  $: games = $draftStore.games;
  $: picks = $draftStore.picks;
  
  // Determine if current user is the host (first player who joined)
  $: isHost = myPlayer && players.length > 0 && players[0]?.id === myPlayer.id;
  
  // Compute game ownership
  $: {
    const validPicks = picks.filter(p => p.undone_at === null);
    const myGameIds = validPicks
      .filter(p => p.player_id === myPlayer?.id)
      .map(p => p.game_id);
    const opponentGameIds = validPicks
      .filter(p => p.player_id !== myPlayer?.id)
      .map(p => p.game_id);
    
    const myGames = games.filter(g => myGameIds.includes(g.id));
    const opponentGames = games.filter(g => opponentGameIds.includes(g.id));
    const availableGames = games.filter(g => !myGameIds.includes(g.id) && !opponentGameIds.includes(g.id));
    
    // Determine whose turn
    const firstPicker = players.find(p => p.is_first_picker);
    const currentTurnId = firstPicker 
      ? getCurrentTurnPlayerId(picks, players, firstPicker.id)
      : null;
    const isMyTurn = myPlayer ? currentTurnId === myPlayer.id : false;
    
    draftStore.update(s => ({
      ...s,
      myGames,
      opponentGames,
      availableGames,
      isMyTurn
    }));
  }
  
  onMount(async () => {
    // Check who the current user is (based on httpOnly cookie)
    // Use cache-busting to ensure fresh response
    try {
      console.log('[CLIENT] Fetching current player...');
      const res = await fetch(`/api/room/${room.code}/me?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      console.log('[CLIENT] Response status:', res.status);
      const data = await res.json();
      console.log('[CLIENT] Player data:', data);
      if (data.myPlayer) {
        console.log('[CLIENT] Setting myPlayer:', data.myPlayer.name);
        myPlayerStore.set(data.myPlayer);
      } else {
        console.log('[CLIENT] No player found - user needs to join');
        myPlayerStore.set(null);
      }
    } catch (e) {
      console.error('[CLIENT] Failed to get current player:', e);
      myPlayerStore.set(null);
    }
    
    // Set up realtime subscriptions
    if (room) {
      uiStore.update(s => ({ ...s, connectionStatus: 'connecting' }));
      
      const handleStatus = (status: string, channelName: string) => {
        console.log(`[REALTIME] ${channelName} status:`, status);
        if (status === 'SUBSCRIBED') {
          uiStore.update(s => ({ ...s, connectionStatus: 'connected' }));
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          uiStore.update(s => ({ ...s, connectionStatus: 'disconnected' }));
          console.error(`[REALTIME] Error on ${channelName}`);
        }
      };

      // Subscribe to room changes
      const roomChannel = supabase
        .channel(`room:${room.id}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${room.id}` },
          (payload) => {
            console.log('[REALTIME] Room updated:', payload);
            roomStore.set(payload.new as typeof room);
          }
        )
        .subscribe((status) => handleStatus(status, 'ROOM'));
      
      // Subscribe to player changes
      const playersChannel = supabase
        .channel(`players:${room.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
          async (payload) => {
            console.log('[REALTIME] Player change detected:', payload);
            const { data: updatedPlayers } = await supabase
              .from('players')
              .select('*')
              .eq('room_id', room.id);
            if (updatedPlayers) {
              console.log('[REALTIME] Updated players list:', updatedPlayers.length);
              playersStore.set(updatedPlayers);
            }
          }
        )
        .subscribe((status) => handleStatus(status, 'PLAYERS'));
      
      // Subscribe to picks
      const picksChannel = supabase
        .channel(`picks:${room.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'picks', filter: `room_id=eq.${room.id}` },
          async (payload) => {
            const { data: updatedPicks } = await supabase
              .from('picks')
              .select('*')
              .eq('room_id', room.id)
              .order('pick_number', { ascending: true });
            if (updatedPicks) {
              draftStore.update(s => ({ ...s, picks: updatedPicks }));
              
              // Check if this is a new pick from opponent
              if (payload.eventType === 'INSERT') {
                const newPick = payload.new as Pick;
                if (newPick.player_id !== myPlayer?.id && !newPick.undone_at) {
                  // Show notification that opponent made a pick
                  notificationStore.show({
                    type: 'opponent-pick',
                    message: `${opponent?.name || 'Your opponent'} picked a game! Your turn.`
                  });
                }
              }
              
              // Hide undo toast if opponent made a pick
              const lastPick = updatedPicks[updatedPicks.length - 1];
              if (lastPick && lastPick.player_id !== myPlayer?.id) {
                uiStore.update(s => ({ ...s, showUndoToast: false }));
                if (undoTimer) clearTimeout(undoTimer);
              }
            }
          }
        )
        .subscribe((status) => handleStatus(status, 'PICKS'));
      
      subscriptions = [
        () => roomChannel.unsubscribe(),
        () => playersChannel.unsubscribe(),
        () => picksChannel.unsubscribe()
      ];
    }
  });
  
  onDestroy(() => {
    subscriptions.forEach(unsub => unsub());
    if (undoTimer) clearTimeout(undoTimer);
  });
  
  async function joinRoom() {
    if (!playerName.trim() || !room) return;
    
    isJoining = true;
    const sessionId = generateSessionId();
    
    const { data: newPlayer, error } = await supabase
      .from('players')
      .insert({
        room_id: room.id,
        name: playerName.trim(),
        session_id: sessionId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Join error:', error);
      isJoining = false;
      return;
    }
    
    // Update store
    playersStore.update(p => [...p, newPlayer]);
    
    // Set myPlayerStore so UI updates immediately
    myPlayerStore.set(newPlayer);
    
    // Set cookie via API
    await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: room.id, sessionId })
    });
    
    isJoining = false;
  }
  
  async function startCoinToss() {
    if (!room || players.length < 2) return;
    
    console.log('[START DRAFT] Starting coin toss...');
    
    // Update room status
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'coin_toss' })
      .eq('id', room.id);
    
    if (error) {
      console.error('[START DRAFT] Error updating room:', error);
      return;
    }
    
    console.log('[START DRAFT] Room status updated to coin_toss');
    
    // Animate coin toss
    uiStore.update(s => ({ ...s, isCoinTossing: true }));
    
    // Determine winner randomly
    setTimeout(async () => {
      const currentPlayers = get(playersStore);
      if (currentPlayers.length < 2) return;
      
      const winnerIndex = Math.random() < 0.5 ? 0 : 1;
      const winner = currentPlayers[winnerIndex];
      const loser = currentPlayers[1 - winnerIndex];
      
      console.log('[START DRAFT] Winner:', winner.name, 'Loser:', loser.name);
      
      // Update players
      await supabase
        .from('players')
        .update({ is_first_picker: true })
        .eq('id', winner.id);
      
      await supabase
        .from('players')
        .update({ is_first_picker: false })
        .eq('id', loser.id);
      
      // Update room to drafting status
      await supabase
        .from('rooms')
        .update({ status: 'drafting' })
        .eq('id', room.id);
      
      console.log('[START DRAFT] Room status updated to drafting');
      
      uiStore.update(s => ({
        ...s,
        isCoinTossing: false,
        coinTossWinner: winner
      }));
    }, 1500);
  }
  
  async function makePick(game: Game) {
    console.log('[MAKE PICK] Attempting to pick:', game.opponent, 'myPlayer:', myPlayer?.name, 'isMyTurn:', $draftStore.isMyTurn);
    
    if (!room || !myPlayer) {
      console.error('[MAKE PICK] Cannot pick - room or myPlayer is null');
      return;
    }
    
    if (!$draftStore.isMyTurn) {
      console.error('[MAKE PICK] Cannot pick - not your turn');
      return;
    }
    
    const pickNumber = picks.filter(p => p.undone_at === null).length + 1;
    console.log('[MAKE PICK] Pick number:', pickNumber);
    
    // Determine player role (p1 or p2) based on room data
    // Assuming players[0] is always p1 (host) and players[1] is p2
    // A more robust check would use room.player1_name/id if available, but checking players array order is consistent with startCoinToss logic
    const currentPlayers = get(playersStore);
    const isPlayer1 = myPlayer.id === currentPlayers[0]?.id;
    const playerRole = isPlayer1 ? 'p1' : 'p2';
    
    console.log('[MAKE PICK] Player role:', playerRole);
    
    const { data: pick, error } = await supabase
      .from('picks')
      .insert({
        room_id: room.id,
        game_id: game.id,
        player_id: myPlayer.id,
        player: playerRole, // Fix: DB expects 'p1' or 'p2' due to check constraint
        pick_number: pickNumber
      })
      .select()
      .single();
    
    if (error) {
      console.error('[MAKE PICK] Error:', error);
      return;
    }
    
    console.log('[MAKE PICK] Success:', pick);
    
    // Show undo toast
    draftStore.update(s => ({ ...s, lastPickId: pick.id }));
    uiStore.update(s => ({ ...s, showUndoToast: true }));
    
    // Auto-hide undo after 5 seconds OR if opponent picks (handled in subscription)
    if (undoTimer) clearTimeout(undoTimer);
    undoTimer = setTimeout(() => {
      uiStore.update(s => ({ ...s, showUndoToast: false }));
    }, 5000);
  }
  
  async function undoPick() {
    const lastPickId = $draftStore.lastPickId;
    if (!lastPickId || !room) return;
    
    // Soft delete the pick
    await supabase
      .from('picks')
      .update({ undone_at: new Date().toISOString() })
      .eq('id', lastPickId);
    
    uiStore.update(s => ({ ...s, showUndoToast: false }));
    if (undoTimer) clearTimeout(undoTimer);
  }
  
  function exportCalendar() {
    const icsContent = generateICS($draftStore.myGames, myPlayer?.name || 'Player');
    downloadICS(icsContent, `tempo-draft-2026-${myPlayer?.name || 'player'}.ics`);
  }
  
  function newDraft() {
    window.location.href = '/';
  }
  
  async function forceRefresh() {
    if (!room) return;
    console.log('[MANUAL] Force refreshing data...');
    
    // Refresh room
    const { data: updatedRoom } = await supabase.from('rooms').select('*').eq('id', room.id).single();
    if (updatedRoom) roomStore.set(updatedRoom);
    
    // Refresh players
    const { data: updatedPlayers } = await supabase.from('players').select('*').eq('room_id', room.id);
    if (updatedPlayers) playersStore.set(updatedPlayers);
    
    // Refresh picks
    const { data: updatedPicks } = await supabase.from('picks').select('*').eq('room_id', room.id).order('pick_number', { ascending: true });
    if (updatedPicks) draftStore.update(s => ({ ...s, picks: updatedPicks }));
  }
</script>

<svelte:head>
  <title>{$draftStore.isMyTurn ? '(YOUR TURN) ' : ''}Tempo Draft - {room?.code}</title>
</svelte:head>

<div class="draft-page">
  <div class="connection-status" class:disconnected={$uiStore.connectionStatus !== 'connected'}>
    <span class="status-dot"></span>
    <span class="status-text">{$uiStore.connectionStatus === 'connected' ? 'LIVE' : 'OFFLINE'}</span>
    <button class="refresh-btn" on:click={forceRefresh} title="Sync Data">↻</button>
  </div>

  {#if !myPlayer}
    <!-- Join Form -->
    <div class="modal-overlay">
      <div class="modal">
        <h2>Join Draft Room</h2>
        <div class="modal__content">
          <label for="playerName">Enter your name</label>
          <input
            type="text"
            id="playerName"
            bind:value={playerName}
            placeholder="Your name"
            maxlength="30"
            on:keypress={(e) => e.key === 'Enter' && joinRoom()}
          />
          
          <button
            class="btn btn--primary"
            on:click={joinRoom}
            disabled={!playerName.trim() || isJoining}
          >
            {isJoining ? 'JOINING...' : 'JOIN DRAFT'}
          </button>
        </div>
      </div>
    </div>
  
  {:else if room?.status === 'waiting'}
    <!-- Waiting Room -->
    <div class="lobby">
      <div class="lobby__header">
        <h1>DRAFT LOBBY</h1>
        <p>Room code: <span class="code">{room.code}</span></p>
      </div>
      
      <div class="lobby__players">
        <div class="player-badge">
          👤 {myPlayer.name} (You)
        </div>
        
        {#if opponent}
          <div class="player-badge player-badge--joined">
            👤 {opponent.name}
          </div>
          
          {#if isHost}
            <button class="btn btn--primary btn--large" on:click={startCoinToss}>
              START DRAFT
            </button>
          {:else}
            <p class="waiting-text">Waiting for host to start...</p>
          {/if}
        {:else}
          <div class="player-badge player-badge--waiting">
            ⭕ Waiting for Player 2...
          </div>
        {/if}
      </div>
      
      <ShareLink roomCode={room.code} />
    </div>
    
  {:else if room?.status === 'coin_toss' || $uiStore.coinTossWinner}
    <!-- Coin Toss -->
    <CoinToss
      player1={players[0]}
      player2={players[1]}
      isAnimating={$uiStore.isCoinTossing}
      winner={$uiStore.coinTossWinner}
      on:complete={() => uiStore.update(s => ({ ...s, coinTossWinner: null }))}
    />
    
  {:else if room?.status === 'drafting'}
    <!-- Draft Board -->
    <div class="draft-interface">
      <header class="draft-header">
        <a href="/" class="draft-header__back">← QUIT</a>
        <span class="draft-header__info">Room: {room.code} • {18 - $draftStore.myGames.length - $draftStore.opponentGames.length} games left</span>
      </header>
      
      <TurnIndicator
        isMyTurn={$draftStore.isMyTurn}
        {opponent}
        myGameCount={$draftStore.myGames.length}
        opponentGameCount={$draftStore.opponentGames.length}
      />
      
      <div class="draft-columns">
        <PlayerColumn
          games={$draftStore.myGames}
          player={myPlayer}
        />
        
        <PlayerColumn
          games={$draftStore.opponentGames}
          player={opponent}
          isOpponent={true}
        />
      </div>
      
      <DraftBoard
        games={$draftStore.games}
        myGames={$draftStore.myGames}
        opponentGames={$draftStore.opponentGames}
        isMyTurn={$draftStore.isMyTurn}
        onSelectGame={makePick}
      />
    </div>
    
    <UndoToast
      show={$uiStore.showUndoToast}
      gameName={$draftStore.myGames[$draftStore.myGames.length - 1]?.opponent || ''}
      timeLeft={5}
      on:undo={undoPick}
    />
    
    <!-- Notification Toast - always available -->
    <NotificationToast />
    
  {:else if room?.status === 'complete'}
    <!-- Results -->
    <div class="results">
      <header class="results__header">
        <a href="/" class="results__back">← HOME</a>
      </header>
      
      <div class="results__title">
        <h1>🎉 DRAFT COMPLETE! 🎉</h1>
      </div>
      
      <div class="results__summary">
        <div class="results__player">
          <span class="results__name">{myPlayer?.name}</span>
          <span class="results__count">{$draftStore.myGames.length}</span>
          <span class="results__label">games</span>
        </div>
        
        <div class="results__player">
          <span class="results__name">{opponent?.name}</span>
          <span class="results__count">{$draftStore.opponentGames.length}</span>
          <span class="results__label">games</span>
        </div>
      </div>
      
      <button class="btn btn--primary btn--large" on:click={exportCalendar}>
        📅 EXPORT TO CALENDAR
      </button>
      
      <div class="results__games">
        <h3>YOUR GAMES</h3>
        <div class="results__list">
          {#each $draftStore.myGames as game}
            <div class="results__game">
              <span class="results__date">{new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {game.game_time}</span>
              <span class="results__opponent">vs {game.opponent}</span>
              <span class="results__venue">{game.venue}</span>
            </div>
          {/each}
        </div>
      </div>
      
      <button class="btn btn--secondary" on:click={newDraft}>
        DRAFT ANOTHER SEASON
      </button>
    </div>
  {/if}
</div>

<style>
  .draft-page {
    min-height: 100vh;
    padding: 1rem;
  }
  
  @media (min-width: 768px) {
    .draft-page {
      padding: 2rem;
    }
  }
  
  .connection-status {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: white;
    border: 2px solid var(--c-text);
    padding: 0.25rem 0.5rem;
    font-family: var(--f-mono);
    font-size: 0.75rem;
    z-index: 1000;
    box-shadow: 2px 2px 0 var(--c-text);
  }
  
  .connection-status.disconnected {
    border-color: #ff4444;
    color: #ff4444;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    background: #00C853;
    border-radius: 50%;
  }
  
  .connection-status.disconnected .status-dot {
    background: #ff4444;
    animation: pulse 1s infinite;
  }
  
  .refresh-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0 0.25rem;
    margin-left: 0.25rem;
    border-left: 1px solid #ccc;
  }
  
  .refresh-btn:hover {
    transform: rotate(180deg);
    transition: transform 0.3s;
  }
  
  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 100;
  }
  
  .modal {
    background: white;
    border: 4px solid var(--c-text);
    box-shadow: var(--s-brutal-lg);
    padding: 2rem;
    width: 100%;
    max-width: 400px;
  }
  
  .modal h2 {
    font-family: var(--f-display);
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .modal__content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .modal__content label {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 0.875rem;
    text-transform: uppercase;
  }
  
  .modal__content input {
    padding: 1rem;
    font-size: 1.25rem;
    border: 3px solid var(--c-text);
    font-family: var(--f-display);
  }
  
  .modal__content input:focus {
    outline: none;
    border-color: var(--c-accent);
  }
  
  /* Lobby */
  .lobby {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .lobby__header {
    text-align: center;
  }
  
  .lobby__header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }
  
  .code {
    font-family: var(--f-mono);
    font-weight: 700;
    color: var(--c-accent);
  }
  
  .lobby__players {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .player-badge {
    padding: 1rem 2rem;
    background: white;
    border: 3px solid var(--c-text);
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 1.125rem;
    width: 100%;
    text-align: center;
  }
  
  .player-badge--joined {
    background: var(--c-accent-2);
  }
  
  .player-badge--waiting {
    border-style: dashed;
    color: var(--c-text-secondary);
    animation: pulse 1.5s infinite;
  }
  
  .waiting-text {
    font-family: var(--f-mono);
    color: var(--c-text-secondary);
    font-size: 0.875rem;
  }
  
  /* Draft Interface */
  .draft-interface {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .draft-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 3px solid var(--c-text);
  }
  
  .draft-header__back {
    font-family: var(--f-display);
    font-weight: 700;
    color: var(--c-text);
  }
  
  .draft-header__info {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .draft-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  /* Results */
  .results {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .results__header {
    padding-bottom: 1rem;
    border-bottom: 3px solid var(--c-text);
  }
  
  .results__back {
    font-family: var(--f-display);
    font-weight: 700;
    color: var(--c-text);
  }
  
  .results__title {
    text-align: center;
  }
  
  .results__title h1 {
    font-size: 2rem;
  }
  
  .results__summary {
    display: flex;
    justify-content: center;
    gap: 2rem;
  }
  
  .results__player {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem 2rem;
    background: white;
    border: 3px solid var(--c-text);
    min-width: 120px;
  }
  
  .results__name {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .results__count {
    font-family: var(--f-display);
    font-size: 3rem;
    font-weight: 700;
    color: var(--c-accent);
  }
  
  .results__label {
    font-family: var(--f-mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    color: var(--c-text-secondary);
  }
  
  .results__games h3 {
    font-family: var(--f-display);
    font-size: 1rem;
    text-transform: uppercase;
    border-bottom: 3px solid var(--c-text);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .results__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .results__game {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    background: white;
    border: 2px solid var(--c-text);
  }
  
  .results__date {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .results__opponent {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1.125rem;
  }
  
  .results__venue {
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    border: 3px solid var(--c-text);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .btn--primary {
    background: var(--c-accent);
    color: white;
    box-shadow: var(--s-brutal);
  }
  
  .btn--primary:hover:not(:disabled) {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--c-text);
  }
  
  .btn--secondary {
    background: transparent;
    color: var(--c-text);
    box-shadow: var(--s-brutal);
  }
  
  .btn--secondary:hover {
    background: var(--c-text);
    color: white;
  }
  
  .btn--large {
    padding: 1.25rem 2rem;
    font-size: 1.125rem;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
