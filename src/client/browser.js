const puppeteer = require('puppeteer');

let _browser = undefined;

function getBrowser() {
    if (_browser) {
        console.log('Returning browser from the cache');
        return Promise.resolve(_browser);
    }
    return puppeteer
        .launch({
            headless: true, args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--ignore-certificate-errors',
                '--disable-infobars',
                '--disable-gpu'
            ]
        })
        .then((browser) => {
            console.log('Returning browser new instance...');
            _browser = browser;
            return browser;
        });
}

async function closeBrowser() {
    try {
        if (_browser) {
            console.log('closing browser instance....');
            await _browser.close();
        }
    } catch (error) {
        console.log(error);
    } finally {
        console.log('setting browser instance to undefined');
        _browser = undefined;
    }
}

module.exports = {
    getBrowser,
    closeBrowser,
}