import { test, expect } from '@playwright/test';

test.use({
  video: 'on',
  viewport: { width: 1280, height: 720 },
});

test.describe('Hero Video Recording', () => {
  test('record hero interaction flow', async ({ page }) => {
    // Navigate to localhost
    await page.goto('/');

    // Wait for the UI to load
    await expect(page.locator('h1')).toContainText('Sovereign Pi Agents');

    // Wait for animations
    await page.waitForTimeout(2000);

    // Hover over the Voice Orb
    const voiceOrb = page.locator('button.bg-gradient-primary').first();
    await voiceOrb.hover();
    await page.waitForTimeout(1000);

    // Click the Voice Orb
    await voiceOrb.click();

    // Wait for internal voice processing to complete (approx 5s total in handleToggle)
    await page.waitForTimeout(6000);

    // Start KYC Agent via AgenticKycSetup
    const startKycBtn = page.locator('button:has-text("Start KYC Agent")');
    await startKycBtn.hover();
    await page.waitForTimeout(500);
    await startKycBtn.click();

    // Wait for KYC flow animation in AgenticKycSetup to finish
    await page.waitForTimeout(5500);

    // Now interact with SetupWizard
    const letsBeginBtn = page.locator('button:has-text("Let\'s Begin")');
    await letsBeginBtn.hover();
    await page.waitForTimeout(500);
    await letsBeginBtn.click();
    await page.waitForTimeout(1500);

    // We are at step 2, upload a file or just manually change step?
    // The SetupWizard has a dropzone. We can trigger step 3 by uploading a file, or just go to KYC modal directly from a button.
    // Let's just find the KYC button, which might need us to trigger step 3.
    // The instructions say "proceed to the step where the 'Sign via Pi KYC' button is visible and click it".
    // We can evaluate script to change React state or we can just upload a dummy file.

    // Create a dummy .aix file
    const aixContent = JSON.stringify({
      AIX_VERSION: "1.2.0",
      manifest: { name: "Video Agent", version: "1.0", author: "Playwright", type: "TOOL" },
      identity: { did: "did:axiom:axiomid.app:video" },
      memory: { episodic: [] },
      skills: []
    });

    const fileInput = await page.evaluateHandle(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        document.body.appendChild(input);
        return input;
    });

    // To simulate drop we can dispatch event or simpler, use page.evaluate to trigger state change if we can't easily drop.
    // Instead of dropping, we can interact with the file input if it existed, but it relies on onDrop.
    // Let's use Playwright's file chooser if there is an input, or simulate a drop event.

    // Dispatch a drop event
    const dataTransfer = await page.evaluateHandle((data) => {
        const dt = new DataTransfer();
        const file = new File([data], 'agent.aix', { type: 'application/json' });
        dt.items.add(file);
        return dt;
    }, aixContent);

    await page.dispatchEvent('text="Drag & Drop"', 'drop', { dataTransfer });
    await page.waitForTimeout(2000);

    // Now we should be on Step 3
    const signKycBtn = page.locator('button:has-text("Sign via Pi KYC")');
    await expect(signKycBtn).toBeVisible();
    await signKycBtn.hover();
    await page.waitForTimeout(500);
    await signKycBtn.click();

    // Wait for KYC Signature Modal and let animations play
    await page.waitForTimeout(4000);

    // End video
  });
});
