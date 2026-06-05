const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('response', response => console.log('RESPONSE:', response.status(), response.url()));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.failure().errorText, request.url()));

    await page.goto('http://localhost:3001/?code=36jDCFJCkUYPQfsQy2gkmLaqYjUui6', { waitUntil: 'networkidle0' });
    
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    if (bodyHTML.includes('This page couldn')) {
      console.log('CRASH DETECTED!');
    }
    
    await browser.close();
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
