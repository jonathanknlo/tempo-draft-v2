<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Player } from '$lib/supabase/types';
  
  export let player1: Player | null = null;
  export let player2: Player | null = null;
  export let isAnimating: boolean = false;
  export let winner: Player | null = null;
  
  const dispatch = createEventDispatcher();
  
  $: if (!isAnimating && winner) {
    setTimeout(() => {
      dispatch('complete');
    }, 3000);
  }
</script>

<div class="coin-toss">
  <h2 class="coin-toss__title">COIN TOSS</h2>
  
  <div class="coin-toss__animation">
    <div class="coin" class:flipping={isAnimating} class:heads={winner && !isAnimating}>
      {#if isAnimating}
        <span class="coin__face">?</span>
      {:else if winner}
        <span class="coin__face">{winner.name[0].toUpperCase()}</span>
      {:else}
        <span class="coin__face">?</span>
      {/if}
    </div>
  </div>
  
  <div class="coin-toss__players">
    <span class="player-name">{player1?.name || 'Player 1'}</span>
    <span class="vs">vs</span>
    <span class="player-name">{player2?.name || 'Player 2'}</span>
  </div>
  
  {#if isAnimating}
    <p class="coin-toss__status">Flipping...</p>
  {:else if winner}
    <div class="coin-toss__result">
      <span class="winner">🎉 {winner.name} GOES FIRST! 🎉</span>
      <span class="countdown">Starting draft...</span>
    </div>
  {:else}
    <p class="coin-toss__status">Ready to flip...</p>
  {/if}
</div>

<style>
  .coin-toss {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    padding: 2rem;
    text-align: center;
  }
  
  .coin-toss__title {
    font-family: var(--f-display);
    font-size: 2rem;
    font-weight: 700;
    border-bottom: 4px solid var(--c-text);
    padding-bottom: 0.5rem;
  }
  
  .coin-toss__animation {
    perspective: 1000px;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .coin {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--c-accent) 0%, #ff6b8a 100%);
    border: 4px solid var(--c-text);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 6px 6px 0 var(--c-text);
    transform-style: preserve-3d;
  }
  
  .coin.flipping {
    animation: coinFlip 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  .coin.heads {
    background: linear-gradient(135deg, var(--c-accent-2) 0%, #80e5ff 100%);
    animation: coinLand 0.5s ease-out;
  }
  
  @keyframes coinFlip {
    0% { transform: rotateY(0) scale(1); }
    50% { transform: rotateY(900deg) scale(1.1); }
    100% { transform: rotateY(1800deg) scale(1); }
  }
  
  @keyframes coinLand {
    0% { transform: scale(1.2); }
    50% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
  
  .coin__face {
    font-family: var(--f-display);
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    text-shadow: 2px 2px 0 var(--c-text);
  }
  
  .coin-toss__players {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-family: var(--f-display);
  }
  
  .player-name {
    font-weight: 700;
    font-size: 1.25rem;
  }
  
  .vs {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .coin-toss__status {
    font-family: var(--f-mono);
    color: var(--c-text-secondary);
    animation: pulse 1.5s infinite;
  }
  
  .coin-toss__result {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .winner {
    font-family: var(--f-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--c-accent);
  }
  
  .countdown {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
