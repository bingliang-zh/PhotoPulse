import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  console.log('Opening PhotoPulse...');
  await page.goto('http://localhost:1420', { waitUntil: 'networkidle' });

  // Wait for Live2D to load
  console.log('Waiting for Live2D model...');
  await page.waitForTimeout(5000);

  const screenshotPath = join(__dirname, 'photopulse_with_live2d.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved: ${screenshotPath}`);

  await browser.close();
})();
