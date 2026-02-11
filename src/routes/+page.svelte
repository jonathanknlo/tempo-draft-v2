<script lang="ts">
  import { enhance } from '$app/forms';
  import { Flame } from 'lucide-svelte';
</script>

<svelte:head>
  <title>Tempo Draft - Draft Toronto Tempo Games with Friends</title>
  <meta name="description" content="Draft Toronto Tempo WNBA games with your friends in real-time. Share a link and pick your games together." />
</svelte:head>

<div class="landing">
  <div class="landing__content">
    <div class="landing__branding">
      <div class="landing__logo">
        <Flame size={64} />
      </div>
      <h1 class="landing__title">
        TEMPO DRAFT
      </h1>
      
      <p class="landing__subtitle">
        Draft Toronto Tempo games with friends. Together.
      </p>
    </div>
    
    <form class="landing__form" method="POST" action="?/createRoom" use:enhance>
      <div class="landing__input-group">
        <label for="playerName" class="landing__label">Enter your name to start</label>
        <input
          type="text"
          id="playerName"
          name="playerName"
          placeholder="Your name"
          maxlength="30"
          required
          class="landing__input"
        />
      </div>
      
      <button type="submit" class="landing__cta">
        CREATE DRAFT ROOM
      </button>
    </form>
    
    <div class="landing__how-it-works">
      <h2>How It Works</h2>
      
      <div class="landing__steps">
        <div class="landing__step">
          <span class="landing__step-number">1</span>
          <p>Create a room</p>
        </div>
        
        <div class="landing__step">
          <span class="landing__step-number">2</span>
          <p>Share the link</p>
        </div>
        
        <div class="landing__step">
          <span class="landing__step-number">3</span>
          <p>Draft 18 games together</p>
        </div>
      </div>
    </div>
    
    <div class="landing__footer">
      <p>🏀 Toronto Tempo • WNBA 2026 Season 🏀</p>
    </div>
  </div>
</div>

<style>
  .landing {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
  }
  
  .landing__content {
    width: 100%;
    max-width: 480px;
    text-align: center;
  }
  
  .landing__branding {
    margin-bottom: 3rem;
  }
  
  .landing__logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    background: var(--c-accent);
    border: 4px solid var(--c-text);
    box-shadow: var(--s-brutal-lg);
    margin-bottom: 1.5rem;
    color: white;
  }
  
  .landing__title {
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
    border-bottom: 4px solid var(--c-text);
    display: inline-block;
    padding-bottom: 0.25em;
  }
  
  .landing__subtitle {
    font-size: 1.125rem;
    color: var(--c-text-secondary);
    margin-top: 1rem;
  }
  
  .landing__form {
    margin-bottom: 3rem;
  }
  
  .landing__input-group {
    margin-bottom: 1.5rem;
  }
  
  .landing__label {
    display: block;
    font-family: var(--f-display);
    font-weight: 600;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    font-size: 0.875rem;
  }
  
  .landing__input {
    width: 100%;
    padding: 1rem;
    font-size: 1.25rem;
    border: 3px solid var(--c-text);
    text-align: center;
    font-family: var(--f-display);
    transition: all var(--t-fast);
  }
  
  .landing__input:focus {
    outline: none;
    border-color: var(--c-accent);
    box-shadow: inset 0 0 0 2px var(--c-accent);
  }
  
  .landing__cta {
    width: 100%;
    padding: 1.25rem 2rem;
    background: var(--c-accent);
    color: white;
    font-family: var(--f-display);
    font-size: 1.25rem;
    font-weight: 700;
    text-transform: uppercase;
    border: 3px solid var(--c-text);
    box-shadow: var(--s-brutal);
    cursor: pointer;
    transition: all var(--t-fast);
  }
  
  .landing__cta:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--c-text);
  }
  
  .landing__cta:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--c-text);
  }
  
  .landing__how-it-works {
    margin-bottom: 3rem;
  }
  
  .landing__how-it-works h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 1.5rem;
    color: var(--c-text-secondary);
  }
  
  .landing__steps {
    display: flex;
    justify-content: center;
    gap: 2rem;
  }
  
  .landing__step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  
  .landing__step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--c-text);
    color: var(--c-bg);
    font-family: var(--f-mono);
    font-weight: 700;
    font-size: 1.25rem;
  }
  
  .landing__step p {
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .landing__footer {
    font-family: var(--f-mono);
    font-size: 0.75rem;
    color: var(--c-text-secondary);
  }
  
  @media (min-width: 768px) {
    .landing__title {
      font-size: 4rem;
    }
    
    .landing__steps {
      gap: 3rem;
    }
  }
</style>
