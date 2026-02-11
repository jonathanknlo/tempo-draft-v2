<script lang="ts">
  import type { Game } from '$lib/supabase/types';
  import { Home, Star } from 'lucide-svelte';
  
  export let game: Game;
  export let isAvailable: boolean = true;
  export let isMine: boolean = false;
  export let isOpponents: boolean = false;
  export let onSelect: (game: Game) => void = () => {};
  
  $: formattedDate = new Date(game.game_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  $: formattedTime = new Date(`2000-01-01T${game.game_time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
</script>

<button
  class="game-card"
  class:available={isAvailable}
  class:mine={isMine}
  class:opponents={isOpponents}
  class:unavailable={!isAvailable && !isMine && !isOpponents}
  on:click={() => isAvailable && onSelect(game)}
  disabled={!isAvailable}
>
  <div class="game-card__header">
    <span class="game-card__date">{formattedDate} • {formattedTime}</span>
    {#if isMine}
      <span class="game-card__claimed">✓ DRAFTED</span>
    {:else if isOpponents}
      <span class="game-card__claimed game-card__claimed--opponent">CLAIMED</span>
    {/if}
  </div>
  
  <div class="game-card__opponent">
    vs {game.opponent}
  </div>
  
  <div class="game-card__venue">
    {game.venue}
  </div>
  
  <div class="game-card__badges">
    {#if game.is_family}
      <span class="badge badge--family">
        <Home size={12} />
        FAMILY
      </span>
    {/if}
    {#if game.is_marquee}
      <span class="badge badge--marquee">
        <Star size={12} />
        STAR
      </span>
    {/if}
  </div>
  
  {#if isAvailable}
    <div class="game-card__action">
      DRAFT THIS
    </div>
  {/if}
</button>

<style>
  .game-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
    background: white;
    border: 3px solid var(--c-text);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
    width: 100%;
  }
  
  .game-card:hover:not(:disabled) {
    background: #FFF0F3;
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .game-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .game-card.mine {
    background: var(--c-bg-secondary);
    border-width: 2px;
  }
  
  .game-card.opponents {
    background: #f5f5f5;
    border-width: 2px;
    border-style: dashed;
  }
  
  .game-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .game-card__date {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .game-card__claimed {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--c-accent);
  }
  
  .game-card__claimed--opponent {
    color: var(--c-text-secondary);
  }
  
  .game-card__opponent {
    font-family: var(--f-display);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--c-text);
  }
  
  .game-card__venue {
    font-size: 0.875rem;
    color: var(--c-text-secondary);
  }
  
  .game-card__badges {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
  }
  
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    border: 2px solid;
  }
  
  .badge--family {
    background: #E8F5E9;
    border-color: #00C853;
    color: #00C853;
  }
  
  .badge--marquee {
    background: #FFF3E0;
    border-color: #FF9800;
    color: #FF9800;
  }
  
  .game-card__action {
    margin-top: 0.5rem;
    padding: 0.75rem;
    background: var(--c-accent);
    color: white;
    font-weight: 700;
    text-align: center;
    border: 3px solid var(--c-text);
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .game-card:hover .game-card__action {
    background: var(--c-text);
  }
</style>
