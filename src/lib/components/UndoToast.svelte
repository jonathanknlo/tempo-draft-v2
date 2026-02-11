<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Undo2 } from 'lucide-svelte';
  
  export let show: boolean = false;
  export let gameName: string = '';
  export let timeLeft: number = 5;
  
  const dispatch = createEventDispatcher();
  
  let progress = 100;
  
  onMount(() => {
    if (show) {
      const interval = setInterval(() => {
        progress -= 20; // 5 seconds = 100%, so 20% per second
      }, 1000);
      
      return () => clearInterval(interval);
    }
  });
  
  function handleUndo() {
    dispatch('undo');
  }
</script>

{#if show}
  <div class="undo-toast">
    <div class="undo-toast__content">
      <div class="undo-toast__info">
        <span class="undo-toast__text">Picked: {gameName}</span>
        <div class="undo-toast__timer">
          <div class="undo-toast__progress">
            <div class="undo-toast__progress-bar" style="width: {progress}%"></div>
          </div>
          <span class="undo-toast__time">{timeLeft}s</span>
        </div>
      </div>
      
      <button class="undo-toast__button" on:click={handleUndo}>
        <Undo2 size={16} />
        UNDO
      </button>
    </div>
  </div>
{/if}

<style>
  .undo-toast {
    position: fixed;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    z-index: 100;
    animation: slideUp 0.3s ease-out;
  }
  
  @media (min-width: 768px) {
    .undo-toast {
      left: auto;
      right: 2rem;
      width: 400px;
    }
  }
  
  .undo-toast__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem;
    background: var(--c-warning);
    border: 3px solid var(--c-text);
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .undo-toast__info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }
  
  .undo-toast__text {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .undo-toast__timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .undo-toast__progress {
    flex: 1;
    height: 4px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }
  
  .undo-toast__progress-bar {
    height: 100%;
    background: var(--c-text);
    transition: width 1s linear;
  }
  
  .undo-toast__time {
    font-family: var(--f-mono);
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 24px;
  }
  
  .undo-toast__button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--c-text);
    color: var(--c-warning);
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.1s ease;
  }
  
  .undo-toast__button:hover {
    background: black;
    transform: scale(1.05);
  }
  
  .undo-toast__button:active {
    transform: scale(0.95);
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
