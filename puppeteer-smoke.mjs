import puppeteer from 'puppeteer';

(async () => {
  const BASE_URL = 'http://localhost:8081';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    const title = await page.title();
    const hasEmail = !!(await page.$('#email'));
    const hasPassword = !!(await page.$('#password'));
    const hasSubmit = !!(await page.$('button[type="submit"]'));
    console.log(JSON.stringify({ ok: hasEmail && hasPassword && hasSubmit, title, hasEmail, hasPassword, hasSubmit }));
  } catch (e) {
    console.error(JSON.stringify({ ok: false, error: e.message }));
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
