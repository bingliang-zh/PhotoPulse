import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:1420/');
  
  // Wait for page to load
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: '/tmp/photopulse_vite.png', fullPage: false });
  console.log('Screenshot saved to /tmp/photopulse_vite.png');
  
  await browser.close();
})();
