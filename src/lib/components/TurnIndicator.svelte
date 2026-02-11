<script lang="ts">
  import type { Player } from '$lib/supabase/types';
  import { Trophy, Clock } from 'lucide-svelte';
  
  export let isMyTurn: boolean = false;
  export let opponent: Player | null = null;
  export let myGameCount: number = 0;
  export let opponentGameCount: number = 0;
  
  $: totalGames = myGameCount + opponentGameCount;
  $: progressPercent = (totalGames / 18) * 100;
</script>

<div class="turn-indicator">
  <div class="turn-indicator__scores">
    <div class="score-card" class:active={isMyTurn}>
      <span class="score-card__label">YOU</span>
      <span class="score-card__count">{myGameCount}</span>
      {#if isMyTurn}
        <Trophy size={16} />
      {/if}
    </div>
    
    <div class="score-card" class:active={!isMyTurn}>
      <span class="score-card__label">{opponent?.name || 'OPPONENT'}</span>
      <span class="score-card__count">{opponentGameCount}</span>
      {#if !isMyTurn}
        <Trophy size={16} />
      {/if}
    </div>
  </div>
  
  <div class="progress-bar">
    <div class="progress-bar__fill" style="width: {progressPercent}%"></div>
  </div>
  
  <div class="turn-banner" class:my-turn={isMyTurn}>
    {#if isMyTurn}
      <Trophy size={24} />
      <span>IT'S YOUR TURN! Pick a game</span>
    {:else}
      <Clock size={24} />
      <span>Waiting for {opponent?.name || 'opponent'}...</span>
    {/if}
  </div>
</div>

<style>
  .turn-indicator {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .turn-indicator__scores {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
  
  .score-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 2rem;
    background: white;
    border: 3px solid var(--c-text);
    min-width: 100px;
    opacity: 0.7;
    transition: all 0.2s ease;
  }
  
  .score-card.active {
    opacity: 1;
    background: var(--c-accent-2);
    box-shadow: 4px 4px 0 var(--c-text);
    transform: translate(-2px, -2px);
  }
  
  .score-card__label {
    font-family: var(--f-mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  
  .score-card__count {
    font-family: var(--f-display);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .progress-bar {
    height: 8px;
    background: #ddd;
    border: 2px solid var(--c-text);
    overflow: hidden;
  }
  
  .progress-bar__fill {
    height: 100%;
    background: var(--c-accent);
    transition: width 0.3s ease;
  }
  
  .turn-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 1rem;
    background: #f5f5f5;
    border: 3px solid var(--c-text);
    font-family: var(--f-display);
    font-weight: 700;
  }
  
  .turn-banner.my-turn {
    background: var(--c-accent);
    color: white;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.9; }
  }
</style>
