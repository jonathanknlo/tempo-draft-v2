<script lang="ts">
  import type { Game } from '$lib/supabase/types';
  import GameCard from './GameCard.svelte';
  
  export let games: Game[] = [];
  export let myGames: Game[] = [];
  export let opponentGames: Game[] = [];
  export let isMyTurn: boolean = false;
  export let onSelectGame: (game: Game) => void = () => {};
  
  $: availableGames = games.filter(
    (g) => !myGames.some((mg) => mg.id === g.id) && !opponentGames.some((og) => og.id === g.id)
  );
</script>

<div class="draft-board">
  <div class="draft-board__available">
    <h3 class="draft-board__title">
      AVAILABLE GAMES ({availableGames.length} remaining)
    </h3>
    
    <div class="draft-board__grid">
      {#each availableGames as game (game.id)}
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
    gap: 2rem;
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
