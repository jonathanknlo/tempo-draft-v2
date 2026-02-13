<script lang="ts">
  import type { Game } from '$lib/supabase/types';
  import GameCard from './GameCard.svelte';
  
  export let games: Game[] = [];
  export let myGames: Game[] = [];
  export let opponentGames: Game[] = [];
  export let isMyTurn: boolean = false;
  export let onSelectGame: (game: Game) => void = () => {};
  
  let filter: 'all' | 'marquee' | 'family' | 'coliseum' | 'scotiabank' = 'all';
  
  $: availableGames = games.filter(
    (g) => !myGames.some((mg) => mg.id === g.id) && !opponentGames.some((og) => og.id === g.id)
  );
  
  $: filteredGames = availableGames.filter((g) => {
    switch (filter) {
      case 'marquee': return g.is_marquee;
      case 'family': return g.is_family;
      case 'coliseum': return g.venue === 'Coca-Cola Coliseum';
      case 'scotiabank': return g.venue === 'Scotiabank Arena';
      default: return true;
    }
  });
</script>

<div class="draft-board">
  <!-- Filters -->
  <div class="filters">
    <button class="filter-btn" class:active={filter === 'all'} on:click={() => filter = 'all'}>
      All ({availableGames.length})
    </button>
    <button class="filter-btn" class:active={filter === 'marquee'} on:click={() => filter = 'marquee'}>
      ⭐ Marquee ({availableGames.filter(g => g.is_marquee).length})
    </button>
    <button class="filter-btn" class:active={filter === 'family'} on:click={() => filter = 'family'}>
      👨‍👩‍👧‍👦 Family ({availableGames.filter(g => g.is_family).length})
    </button>
    <button class="filter-btn" class:active={filter === 'coliseum'} on:click={() => filter = 'coliseum'}>
      🏟️ Coliseum ({availableGames.filter(g => g.venue === 'Coca-Cola Coliseum').length})
    </button>
    <button class="filter-btn" class:active={filter === 'scotiabank'} on:click={() => filter = 'scotiabank'}>
      🏟️ Scotiabank ({availableGames.filter(g => g.venue === 'Scotiabank Arena').length})
    </button>
  </div>
  
  <div class="draft-board__available">
    <h3 class="draft-board__title">
      AVAILABLE GAMES ({filteredGames.length} remaining)
    </h3>
    
    <div class="draft-board__grid">
      {#each filteredGames as game (game.id)}
        <GameCard
          {game}
          isAvailable={isMyTurn}
          onSelect={onSelectGame}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  .draft-board {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    background: var(--c-bg-secondary);
    border: 3px solid var(--c-text);
  }
  
  .filter-btn {
    padding: 0.5rem 1rem;
    font-family: var(--f-display);
    font-size: 0.875rem;
    font-weight: 600;
    background: white;
    border: 2px solid var(--c-text);
    cursor: pointer;
    transition: all 0.1s;
  }
  
  .filter-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 2px 2px 0 var(--c-text);
  }
  
  .filter-btn.active {
    background: var(--c-accent);
    color: white;
  }
  
  .draft-board__title {
    font-family: var(--f-display);
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 3px solid var(--c-text);
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .draft-board__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  @media (min-width: 768px) {
    .draft-board__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  
  @media (min-width: 1024px) {
    .draft-board__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>