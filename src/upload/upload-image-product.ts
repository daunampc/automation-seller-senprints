import { Page } from "puppeteer";

const maxRetries = 3;
const waitTimeout = 6000; // 6s
async function confirmUploadWithRetry(page: Page) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Lần đầu tiên assume bạn đã click Upload trước rồi,
      // các lần sau nếu cần, bạn có thể click lại:
      if (attempt > 1) {
        console.log(`🔄 Thử lại lần ${attempt}: click lại Upload`);
        await page.click('button.btnUpload:not(.disabled)');
        // chờ chuyển sang trạng thái uploading
        await page.waitForSelector('button.btnUpload.disabled[disabled]', { timeout: waitTimeout });
      }

      // Chờ Add text button xuất hiện trong 6s
      await page.waitForSelector(
        'button.btn-sm.btn-primary:not(.btnUpload)',
        { timeout: waitTimeout }
      );

      console.log(`✅ Upload thành công sau ${attempt} lần thử!`);
      return; // thoát hàm, khỏi vòng retry
    } catch (err: any) {
      if (err.name === 'TimeoutError') {
        console.warn(`⚠️ Timeout sau 6s lần thử ${attempt}`);
        if (attempt === maxRetries) {
          throw new Error(`Upload không thành công sau ${maxRetries} lần thử`);
        }
        // optional: đợi một khoảng nhỏ trước khi retry
        await new Promise(r => setTimeout(r, 10000));
      } else {
        // lỗi khác thì không retry
        throw err;
      }
    }
  }
}

