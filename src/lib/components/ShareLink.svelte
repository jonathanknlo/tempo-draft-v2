<script lang="ts">
  import { Copy, Share2, Check } from 'lucide-svelte';
  
  export let roomCode: string;
  
  let copied = false;
  
  $: shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/draft/${roomCode}`;
  
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
      setTimeout(() => copied = false, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }
  
  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my Tempo Draft',
          text: 'Come draft Toronto Tempo games with me!',
          url: shareUrl
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyLink();
    }
  }
</script>

<div class="share-link">
  <h3 class="share-link__title">SHARE THIS LINK</h3>
  
  <div class="share-link__url">
    <input
      type="text"
      readonly
      value={shareUrl}
      class="share-link__input"
    />
  </div>
  
  <div class="share-link__actions">
    <button
      class="btn btn--secondary"
      on:click={copyLink}
    >
      {#if copied}
        <Check size={18} />
        COPIED!
      {:else}
        <Copy size={18} />
        COPY
      {/if}
    </button>
    
    <button
      class="btn btn--primary"
      on:click={shareLink}
    >
      <Share2 size={18} />
      SHARE
    </button>
  </div>
</div>

<style>
  .share-link {
    background: white;
    border: 3px solid var(--c-text);
    padding: 1.5rem;
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .share-link__title {
    font-family: var(--f-display);
    font-size: 0.875rem;
    font-weight: 700;
    margin-bottom: 1rem;
    text-transform: uppercase;
  }
  
  .share-link__url {
    margin-bottom: 1rem;
  }
  
  .share-link__input {
    width: 100%;
    padding: 0.75rem;
    font-family: var(--f-mono);
    font-size: 0.875rem;
    border: 3px solid var(--c-text);
    background: var(--c-bg-secondary);
    color: var(--c-text);
    cursor: text;
  }
  
  .share-link__actions {
    display: flex;
    gap: 0.75rem;
  }
  
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    border: 3px solid var(--c-text);
    cursor: pointer;
    transition: all 0.1s ease;
  }
  
  .btn--primary {
    background: var(--c-accent);
    color: white;
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .btn--primary:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--c-text);
  }
  
  .btn--primary:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--c-text);
  }
  
  .btn--secondary {
    background: transparent;
    color: var(--c-text);
    box-shadow: 4px 4px 0 var(--c-text);
  }
  
  .btn--secondary:hover {
    background: var(--c-text);
    color: white;
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--c-text);
  }
  
  .btn--secondary:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--c-text);
  }
</style>
