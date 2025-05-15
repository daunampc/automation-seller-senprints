// login.js
import puppeteer, { ElementHandle } from 'puppeteer';
import { config } from './config/config';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

export async function doLogin(): Promise<void> {
  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
    slowMo: 50,
    defaultViewport: null,
    executablePath: config.chromePath,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  // 1. Vào trang login
  await page.goto('https://seller.senprints.com/auth/login', { waitUntil: 'networkidle2' });

  // 2. Điền email/password
  await page.type('input[name="email"]', config.email);
  await page.type('input[name="password"]', config.password);

  // 3. Click Log In
  await Promise.all([
    page.click('button.btn.btn-primary.btn-block[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);
  console.log('✅ Logged in, current URL:', page.url());

  // 4. Nếu vẫn redirect về `?ref=login`, tự chuyển tiếp
  if (page.url().includes('ref=login')) {
    await page.goto('https://seller.senprints.com/campaigns', { waitUntil: 'networkidle2' });
    console.log('⏩ Redirected to campaigns');
  }

  // 5. Đóng modal (nếu có)
  try {
    await page.waitForSelector('button.close[data-dismiss="modal"][aria-label="Close"]', { visible: true, timeout: 1000 });
    await page.click('button.close[data-dismiss="modal"][aria-label="Close"]');
    console.log('🔔 Modal closed');
  } catch {
    console.log('ℹ️ No modal to close');
  }

  // 6. Chờ button “Create campaign” hiện, và click
  await page.waitForSelector('div.btnCreateCampaign > button.btn.btn-primary.active:not(.dropdown-toggle)', { visible: true, timeout: 10000 });
  await page.click('div.btnCreateCampaign > button.btn.btn-primary.active:not(.dropdown-toggle)');
  console.log('▶️ Clicked Create campaign');


  // Pause để debug nếu cần
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button'))
      .some(b => b.textContent?.trim().toLowerCase() === 'ghost');
  }, { timeout: 15000 });
  // Click the 'ghost' button
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).
      find(b => b.textContent?.trim().toLowerCase() === 'ghost');
    if (btn) (btn as HTMLElement).click();
  });
  console.log('▶️ Clicked ghost button');

  //
  // 7. Chờ và click đúng product card dựa trên id
  const cardSelector = `div.card.card-border#${config.productId}`;
  await page.waitForSelector(cardSelector, { visible: true, timeout: 10000 });
  await page.click(cardSelector);
  console.log(`▶️ Clicked product card with id="${config.productId}"`);
  await page.waitForSelector('button.btn.btn-primary.btnSelectedProducts', {
    visible: true,
    timeout: 10000
  });
  console.log('▶️ Selected product and clicked Continue Products');


  // Click nút Continue
  await page.click('button.btn.btn-primary.btnSelectedProducts');

  // 10. Upload file từ buffer hoặc local
  const inputSel = '#upload-design';
  //await page.waitForSelector(inputSel, { visible: true, timeout: 10000 });
  await page.waitForSelector(inputSel, { timeout: 10000 });

  // const inputHandle = await page.$(inputSel) as ElementHandle<HTMLInputElement>;;
  const element = await page.$(inputSel);
  if (!element) throw new Error('Không tìm thấy input upload');
  const inputHandle = element as ElementHandle<HTMLInputElement>;

  if (!inputHandle) throw new Error('Không tìm thấy input upload');

  const imageUrl = config.imagePath; // ensure this is set in .env
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const fileName = path.basename(new URL(imageUrl).pathname);


  const tempFilePath = path.join(os.tmpdir(), fileName);
  await fs.writeFile(tempFilePath, buffer);
  console.log(`🖼️ Image downloaded to temp path: ${tempFilePath}`);

  await inputHandle.uploadFile(tempFilePath);
  console.log(`🖼️ Uploaded image from URL: ${imageUrl}`);

  // … hoặc với buffer từ URL như trước …
  try {
    await page.waitForSelector('.upload-success-toast', { timeout: 15000 });
    console.log('🎉 Upload thành công');
  } catch {
    console.log('⚠️ Có thể upload thành công nhưng không thấy toast');
  }





  // const continuePricingBtn = 'button.btn.btn-primary.float-right.btnContinuePricing';
  // await page.waitForSelector(continuePricingBtn, { visible: true, timeout: 10000 });
  // await page.click(continuePricingBtn);
  // console.log('▶️ Clicked Continue Pricing');
  //
  // // 13. Điền giá sell price = 19.95
  // const priceInput = 'input.inputSellPrice';
  // await page.waitForSelector(priceInput, { visible: true, timeout: 10000 });
  // await page.click(priceInput, { clickCount: 3 });
  // await page.type(priceInput, '19.95');
  // console.log('▶️ Set sell price to 19.95');
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
}
