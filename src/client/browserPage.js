const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];

async function emulateIPhoneX(page) {
    await page.emulate(iphoneX);
    this._page = page;
    return page;
}

function browser() {
    if (this._page) return Promise.resolve(this._page);

    return puppeteer
        .launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        .then((browser) => browser.pages())
        .then((pages) => pages[0])
        .then((page) => {
            console.log('setting iphone x');
            return new Promise((resolve, reject) => {
                emulateIPhoneX(page, resolve, reject);
            });
        })
        .then(page => page);
};

module.exports = {
    page: browser
}