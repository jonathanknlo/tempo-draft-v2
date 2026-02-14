import { test, expect, chromium } from '@playwright/test';

test('should complete the 18th pick and end draft', async () => {
  const browser = await chromium.launch();
  const p1Context = await browser.newContext();
  const p1Page = await p1Context.newPage();
  const p2Context = await browser.newContext();
  const p2Page = await p2Context.newPage();
  
  // Capture key logs
  p1Page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[TURN DEBUG]') || text.includes('Final pick') || text.includes('complete')) {
      console.log(`[P1] ${text}`);
    }
  });
  
  try {
    console.log('Creating room and joining...');
    
    // P1 creates room
    await p1Page.goto('https://tempo-draft-v2.vercel.app');
    await p1Page.fill('input[name="playerName"]', 'Host');
    await p1Page.click('button[type="submit"]');
    await p1Page.waitForURL(/\/draft\//, { timeout: 10000 });
    const roomUrl = p1Page.url();
    
    // P2 joins
    await p2Page.goto(roomUrl);
    await p2Page.fill('input[placeholder="Your name"]', 'Guest');
    await p2Page.click('button:has-text("JOIN DRAFT")');
    await p1Page.waitForTimeout(1500);
    
    // Start draft
    await p1Page.click('button:has-text("START DRAFT")');
    await p1Page.waitForTimeout(3000);
    await p2Page.waitForTimeout(3000);
    
    console.log('Rapidly picking 17 games...');
    
    // Quickly pick 17 games (using API to speed up)
    const roomCode = roomUrl.split('/').pop();
    
    // Use direct Supabase calls to insert picks faster
    for (let i = 1; i <= 17; i++) {
      // Determine whose turn
      const p1Turn = await p1Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
      const activePage = p1Turn ? p1Page : p2Page;
      
      // Click first available game
      const btn = activePage.locator('button:has-text("DRAFT THIS")').first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        await activePage.waitForTimeout(300); // Fast picks
      }
      
      if (i % 5 === 0) console.log(`  Pick ${i}/17 done`);
    }
    
    console.log('Now testing the 18th (final) pick...');
    
    // Wait for turn indicator to settle
    await p1Page.waitForTimeout(1000);
    await p2Page.waitForTimeout(1000);
    
    // Find who has the last pick
    const p1Turn = await p1Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
    const p2Turn = await p2Page.locator('.turn-banner:has-text("IT\'S YOUR TURN")').isVisible().catch(() => false);
    
    console.log(`P1 turn: ${p1Turn}, P2 turn: ${p2Turn}`);
    
    const activePage = p1Turn ? p1Page : p2Page;
    const activeName = p1Turn ? 'P1' : 'P2';
    
    // Get remaining games count before final pick
    const remainingBefore = await activePage.locator('button:has-text("DRAFT THIS")').count();
    console.log(`Games remaining before final pick: ${remainingBefore}`);
    expect(remainingBefore).toBe(1);
    
    // CLICK THE FINAL PICK
    console.log(`${activeName} clicking final pick...`);
    const finalBtn = activePage.locator('button:has-text("DRAFT THIS")').first();
    await expect(finalBtn).toBeVisible({ timeout: 5000 });
    await finalBtn.click();
    
    // Wait for completion
    console.log('Waiting for draft completion...');
    await activePage.waitForTimeout(2000);
    
    // Check both pages for completion indicators
    const p1Complete = await p1Page.locator('text=DRAFT COMPLETE').isVisible().catch(() => false);
    const p2Complete = await p2Page.locator('text=DRAFT COMPLETE').isVisible().catch(() => false);
    const p1Results = await p1Page.locator('text=games').isVisible().catch(() => false);
    const p2Results = await p2Page.locator('text=games').isVisible().catch(() => false);
    
    console.log('=== FINAL PICK RESULTS ===');
    console.log(`P1 sees completion: ${p1Complete}`);
    console.log(`P2 sees completion: ${p2Complete}`);
    console.log(`P1 sees results: ${p1Results}`);
    console.log(`P2 sees results: ${p2Results}`);
    
    // Take final screenshots
    await p1Page.screenshot({ path: '/tmp/p1-final.png' });
    await p2Page.screenshot({ path: '/tmp/p2-final.png' });
    
    // Assert completion
    expect(p1Complete || p1Results).toBeTruthy();
    expect(p2Complete || p2Results).toBeTruthy();
    
    console.log('✅ 18TH PICK TEST SUCCESSFUL!');
    
  } finally {
    await browser.close();
  }
});