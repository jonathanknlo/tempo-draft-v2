<script lang="ts">
  import type { Game, Player } from '$lib/supabase/types';
  import GameCard from './GameCard.svelte';
  
  export let games: Game[] = [];
  export let player: Player | null = null;
  export let isOpponent: boolean = false;
</script>

<div class="player-column">
  <div class="player-column__header">
    <span class="player-column__name">
      {isOpponent ? (player?.name || 'Opponent') : 'YOU'}
    </span>
    <span class="player-column__count">{games.length} games</span>
  </div>
  
  <div class="player-column__games">
    {#each games as game (game.id)}
      <GameCard
        {game}
        isAvailable={false}
        isMine={!isOpponent}
        isOpponents={isOpponent}
      />
    {/each}
    
    {#if games.length === 0}
      <div class="player-column__empty">
        {isOpponent ? 'No games claimed yet' : 'No games drafted yet'}
      </div>
    {/if}
  </div>
</div>

<style>
  .player-column {
    background: white;
    border: 3px solid var(--c-text);
    padding: 1rem;
  }
  
  .player-column__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 3px solid var(--c-text);
    margin-bottom: 1rem;
  }
  
  .player-column__name {
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 1rem;
  }
  
  .player-column__count {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .player-column__games {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
  }
  
  .player-column__empty {
    padding: 2rem;
    text-align: center;
    color: var(--c-text-secondary);
    font-style: italic;
    border: 2px dashed #ddd;
  }
</style>
