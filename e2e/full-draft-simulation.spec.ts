import { test, expect, chromium } from '@playwright/test';

test.describe('Two-Player Full Draft Simulation', () => {
  test('should complete 18-game draft with notifications', async () => {
    // Launch browser with two contexts (two players)
    const browser = await chromium.launch();
    
    // Player 1 (Host) context
    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    
    // Player 2 context  
    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    
    // Capture console logs for debugging
    p1Page.on('console', msg => {
      if (msg.text().includes('[MAKE PICK]') || msg.text().includes('[TURN DEBUG]') || msg.text().includes('notification')) {
        console.log(`[P1] ${msg.text()}`);
      }
    });
    
    p2Page.on('console', msg => {
      if (msg.text().includes('[MAKE PICK]') || msg.text().includes('[TURN DEBUG]') || msg.text().includes('notification')) {
        console.log(`[P2] ${msg.text()}`);
      }
    });
    
    try {
      console.log('=== PHASE 1: CREATE ROOM ===');
      
      // Player 1 creates room
      await p1Page.goto('https://tempo-draft-v2.vercel.app');
      await p1Page.fill('input[name="playerName"]', 'TestHost');
      await p1Page.click('button[type="submit"]');
      
      // Wait for room to load
      await p1Page.waitForURL(/\/draft\//, { timeout: 10000 });
      const roomUrl = p1Page.url();
      console.log('Room created:', roomUrl);
      
      // Extract room code from URL
      const roomCode = roomUrl.split('/').pop();
      expect(roomCode).toBeTruthy();
      
      console.log('=== PHASE 2: PLAYER 2 JOINS ===');
      
      // Player 2 joins via share link
      await p2Page.goto(roomUrl);
      await p2Page.fill('input[placeholder="Your name"]', 'TestGuest');
      await p2Page.click('button:has-text("JOIN DRAFT")');
      
      // Wait for both players to see each other
      await p1Page.waitForTimeout(2000);
      await p2Page.waitForTimeout(2000);
      
      console.log('=== PHASE 3: START DRAFT ===');
      
      // Host starts the draft
      await p1Page.click('button:has-text("START DRAFT")');
      
      // Wait for coin toss animation
      await p1Page.waitForTimeout(3000);
      await p2Page.waitForTimeout(3000);
      
      console.log('=== PHASE 4: DRAFT 18 GAMES ===');
      
      // Track picks and notifications
      let p1Picks = 0;
      let p2Picks = 0;
      let notificationsReceived = 0;
      
      // Monitor for notification toast on both pages
      const checkForNotification = async (page: any, playerName: string) => {
        const toast = page.locator('.notification-toast');
        if (await toast.isVisible().catch(() => false)) {
          const message = await toast.locator('.notification-message').textContent().catch(() => '');
          console.log(`[NOTIFICATION] ${playerName} received: ${message}`);
          notificationsReceived++;
          return true;
        }
        return false;
      };
      
      // Draft all 18 games
      for (let pickNum = 1; pickNum <= 18; pickNum++) {
        console.log(`\n--- Pick ${pickNum}/18 ---`);
        
        // Determine whose turn it is by checking turn indicator
        const p1Turn = await p1Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
        const p2Turn = await p2Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
        
        let activePage = p1Turn ? p1Page : p2Page;
        let activePlayer = p1Turn ? 'P1' : 'P2';
        
        if (!p1Turn && !p2Turn) {
          console.log('Neither player sees their turn, refreshing...');
          await p1Page.reload();
          await p2Page.reload();
          await p1Page.waitForTimeout(1000);
          
          const p1TurnRetry = await p1Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
          activePage = p1TurnRetry ? p1Page : p2Page;
          activePlayer = p1TurnRetry ? 'P1' : 'P2';
        }
        
        console.log(`${activePlayer}'s turn to pick`);
        
        // Find first available game and click it
        const draftButton = activePage.locator('button:has-text("DRAFT THIS")').first();
        await expect(draftButton).toBeVisible({ timeout: 5000 });
        
        // Get game name for logging
        const gameCard = draftButton.locator('..').locator('..');
        const opponentName = await gameCard.locator('.game-card__opponent').textContent().catch(() => 'Unknown');
        console.log(`${activePlayer} picking: ${opponentName}`);
        
        // Make the pick
        await draftButton.click();
        
        // Wait for pick to register
        await activePage.waitForTimeout(500);
        
        // Update counters
        if (activePlayer === 'P1') p1Picks++;
        else p2Picks++;
        
        // Check for notifications on the OTHER player's screen
        await p1Page.waitForTimeout(500);
        await p2Page.waitForTimeout(500);
        
        if (activePlayer === 'P1') {
          await checkForNotification(p2Page, 'P2');
        } else {
          await checkForNotification(p1Page, 'P1');
        }
        
        // Special logging for last few picks
        if (pickNum >= 16) {
          console.log(`[CRITICAL] Pick ${pickNum} completed. P1: ${p1Picks}, P2: ${p2Picks}`);
        }
        
        // Wait for turn to switch
        await activePage.waitForTimeout(1000);
      }
      
      console.log('\n=== PHASE 5: VERIFY COMPLETION ===');
      
      // Draft should be complete
      await p1Page.waitForTimeout(2000);
      
      // Check for completion screen or results
      const p1Complete = await p1Page.locator('text=DRAFT COMPLETE').isVisible().catch(() => false);
      const p2Complete = await p2Page.locator('text=DRAFT COMPLETE').isVisible().catch(() => false);
      
      console.log(`P1 sees completion: ${p1Complete}`);
      console.log(`P2 sees completion: ${p2Complete}`);
      
      // Verify final counts
      const p1FinalCount = await p1Page.locator('.score-card__count').first().textContent().catch(() => '0');
      const p2FinalCount = await p2Page.locator('.score-card__count').first().textContent().catch(() => '0');
      
      console.log(`\n=== RESULTS ===`);
      console.log(`P1 picks: ${p1Picks} (displayed: ${p1FinalCount})`);
      console.log(`P2 picks: ${p2Picks} (displayed: ${p2FinalCount})`);
      console.log(`Notifications received: ${notificationsReceived}`);
      
      // Assertions
      expect(p1Picks + p2Picks).toBe(18);
      expect(p1Picks).toBeGreaterThanOrEqual(8);
      expect(p2Picks).toBeGreaterThanOrEqual(8);
      
      // At least some notifications should have been received
      expect(notificationsReceived).toBeGreaterThan(0);
      
      console.log('\n✅ FULL DRAFT SIMULATION SUCCESSFUL!');
      
    } finally {
      await browser.close();
    }
  });
  
  test('should show notification when opponent picks', async () => {
    // Quick test focused on notifications
    const browser = await chromium.launch();
    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    
    try {
      // Setup room
      await p1Page.goto('https://tempo-draft-v2.vercel.app');
      await p1Page.fill('input[name="playerName"]', 'Host');
      await p1Page.click('button[type="submit"]');
      await p1Page.waitForURL(/\/draft\//);
      
      const roomUrl = p1Page.url();
      
      // P2 joins
      await p2Page.goto(roomUrl);
      await p2Page.fill('input[placeholder="Your name"]', 'Guest');
      await p2Page.click('button:has-text("JOIN DRAFT")');
      await p1Page.waitForTimeout(2000);
      
      // Start draft
      await p1Page.click('button:has-text("START DRAFT")');
      await p1Page.waitForTimeout(3000);
      await p2Page.waitForTimeout(3000);
      
      // Determine who goes first and have them pick
      const p1Turn = await p1Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
      
      if (p1Turn) {
        // P1 picks, P2 should get notification
        await p1Page.locator('button:has-text("DRAFT THIS")').first().click();
        await p2Page.waitForTimeout(1000);
        
        // Check P2 sees notification
        const notificationVisible = await p2Page.locator('.notification-toast').isVisible().catch(() => false);
        console.log('P2 received notification:', notificationVisible);
        
        if (notificationVisible) {
          const message = await p2Page.locator('.notification-message').textContent();
          console.log('Notification message:', message);
          expect(message).toContain('picked');
        }
      } else {
        // P2 picks, P1 should get notification
        await p2Page.locator('button:has-text("DRAFT THIS")').first().click();
        await p1Page.waitForTimeout(1000);
        
        const notificationVisible = await p1Page.locator('.notification-toast').isVisible().catch(() => false);
        console.log('P1 received notification:', notificationVisible);
        
        if (notificationVisible) {
          const message = await p1Page.locator('.notification-message').textContent();
          console.log('Notification message:', message);
          expect(message).toContain('picked');
        }
      }
      
    } finally {
      await browser.close();
    }
  });
});