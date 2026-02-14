<script lang="ts">
  import { fade, fly } from 'svelte/transition';
  import { Bell, X, Trophy, UserPlus } from 'lucide-svelte';
  import { notificationStore } from '$lib/stores/notification';
  import { onMount } from 'svelte';
  
  let audio: HTMLAudioElement | null = null;
  
  onMount(() => {
    // Create audio element for notification sound
    audio = new Audio('/notification.mp3');
    audio.volume = 0.4;
  });
  
  // Play sound when notification appears
  $: if ($notificationStore && audio) {
    audio.play().catch(() => {
      // Ignore autoplay errors - user may need to interact first
    });
  }
  
  function getIcon(type: string) {
    switch (type) {
      case 'opponent-pick': return Bell;
      case 'your-turn': return Trophy;
      case 'player-joined': return UserPlus;
      default: return Bell;
    }
  }
  
  function getBackground(type: string) {
    switch (type) {
      case 'opponent-pick': return 'var(--c-accent-2)';
      case 'your-turn': return 'var(--c-accent)';
      case 'player-joined': return '#4CAF50';
      default: return 'var(--c-accent-2)';
    }
  }
</script>

{#if $notificationStore}
  <div 
    class="notification-toast"
    style="background-color: {getBackground($notificationStore.type)}"
    transition:fly={{ y: -50, duration: 300 }}
    role="alert"
    on:click={() => notificationStore.dismiss()}
  >
    <div class="notification-icon">
      <svelte:component this={getIcon($notificationStore.type)} size={24} />
    </div>
    
    <div class="notification-content">
      <p class="notification-message">{$notificationStore.message}</p>
    </div>
    
    <button 
      class="notification-close" 
      on:click|stopPropagation={() => notificationStore.dismiss()}
      aria-label="Dismiss notification"
    >
      <X size={20} />
    </button>
  </div>
{/if}

<style>
  .notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    left: 20px;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    color: white;
    border: 3px solid var(--c-text);
    box-shadow: 6px 6px 0 var(--c-text);
    cursor: pointer;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  }
  
  @keyframes slideIn {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @media (min-width: 480px) {
    .notification-toast {
      left: auto;
      margin: 0;
    }
  }
  
  .notification-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .notification-content {
    flex: 1;
    min-width: 0;
  }
  
  .notification-message {
    font-family: var(--f-display);
    font-weight: 600;
    font-size: 1rem;
    margin: 0;
    line-height: 1.4;
  }
  
  .notification-close {
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.2);
    border: 2px solid white;
    color: white;
    padding: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }
  
  .notification-close:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
</style>