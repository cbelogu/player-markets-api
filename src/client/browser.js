const puppeteer = require('puppeteer');

let _browser = undefined;

function getBrowser() {
    if (_browser) {
        return Promise.resolve(_browser);
    }
    return puppeteer
        .launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        .then((browser) => {
            _browser = browser;
            return browser;
        });
}

async function closeBrowser() {
    try {
        if (_browser) {
            await _browser.close();
        }
    } catch (error) {
        console.log(error);
        _browser = undefined;
    }

}

module.exports = {
    getBrowser,
    closeBrowser,
}