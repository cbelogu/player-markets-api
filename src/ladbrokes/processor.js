const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];
const _cache = require('../client/cacheManager').cacheManager;

const $ = require('cheerio');

const url = 'https://www.ladbrokes.com.au/sports/basketball/usa/nba';
const CACHEKEY_URLS = 'Ladbrokes_Match_Urls';
const CACHEKEY_MATCH = 'Ladbrokes_Match_Markets_';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let _browser = undefined;

async function getMatchUrl(matchName) {
    const namesArray = matchName.split(' At ');
    const formattedName = String(namesArray[1] + ' v ' + namesArray[0]).replace(/\s/g, '-').replace('76ers', '76-ers').toLowerCase();
    console.log(formattedName);
    const cachedData = _cache.get(CACHEKEY_URLS);
    if (cachedData) return Promise.resolve(cachedData.find((e) => e.includes(formattedName)));

    return puppeteer
        .launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
        .then((browser) => {
            _browser = browser;
            console.log('LADBROKES urls not cached, fetching from server');
            return new Promise((resolve, reject) => {
                extractUrls(formattedName, resolve, reject);
            });
        })
        .then(result => result)
        .catch(function (err) {
            throw new Error(err);
        });
};

async function extractUrls(formattedName, resolve, reject) {
    try {
        const page = (await _browser.pages())[0];
        await page.emulate(iphoneX);
        await page.goto(url);
        await sleep(1000);
        const html = await page.content();
        const urls = [];
        const links = $('.sports-event-entry-with-markets > a', html);
        for (let index = 0; index < links.length; index++) {
            const element = links[index];
            urls.push(element.attribs.href);
        }
        console.log(`CACHED Ladbrokes urls are ${urls}`);
        const cacheSuccess = _cache.set(CACHEKEY_URLS, urls);
        if (cacheSuccess) console.log('LADBROKES URLs cached successfully');
        return resolve(urls.find((e) => e.includes(formattedName)));
    } catch (error) {
        return reject(error);
    }
}

async function getPlayerMarkets(matchName) {
    const path = await getMatchUrl(matchName);
    if (!path) {
        console.log('UNABLE to find url for ladbrokes match ' + matchName);
        return Promise.resolve([]);
    }
    const url = `https://www.ladbrokes.com.au${path}`;
    console.log(`final url is ${url}`);
    const cacheKey = `${CACHEKEY_MATCH}${matchName}`.replace(' ', '-');
    const cachedData = _cache.get(cacheKey);
    if (cachedData) {
        console.log('SERVING MATCH RESPONSE FROM CACHE - LADBROKES - ' + cacheKey);
        return Promise.resolve(extractMarketsFromResponse(cachedData));
    }

    const browser = _browser || await puppeteer
        .launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

    return Promise.resolve(browser)
        .then((browser) => {
            return new Promise((resolve, reject) => {
                extractMarkets(browser, url, resolve, reject);
            });
        })
        .then((data) => {
            console.log('Caching Ladbrokes Match Data for ' + cacheKey);
            _cache.set(cacheKey, data);
            const result = extractMarketsFromResponse(data);
            return {
                data: result,
                browser
            };
        })
        .catch((err) => {
            console.log(err);
            return [];
        });
}

function extractMarketsFromResponse(data) {
    const playerMarkets = [];
    for (let index = 0; index < data.length; index++) {
        const market = data[index];
        const props = market.trim().split('\n');
        const playerName = props[0].split('Over')[0].trim();
        const handiCap = props[0].split('Over')[1].trim().replace(' Points', '').trim();
        const playerMarket = {
            playerName,
            handiCap,
            overPrice: props[1].trim(),
            underPrice: props[3].trim()
        };
        playerMarkets.push(playerMarket);
    }
    return playerMarkets;
}

async function extractMarkets(browser, url, resolve, reject) {
    try {
        const page = (await browser.pages())[0];
        await page.emulate(iphoneX);
        await page.goto(url);
        await sleep(1000);
        page.waitForSelector('div.accordion__title.accordion-markets__title', { visible: true });
        await page.$$eval('div.accordion__title.accordion-markets__title>h3>span', elements => {
            let index = elements.findIndex(e => /player point markets/i.test(e.textContent));
            if (index !== -1) {
                elements[index].click();
                return;
            }
        });
        await page.$$eval('div.accordion__title.accordion-markets-nested__title.collapsed', elements => {
            for (let index = 0; index < elements.length; index++) {
                const element = elements[index];
                if (element.textContent.includes('Player Points O/U')) {
                    element.click();
                    console.log(element.textContent);
                }
            }
        });
        let data = await page.$$eval('div.accordion__content.accordion-content-container.accordion-markets-nested__content.expanded', elements => {
            let data = [];
            for (let index = 0; index < elements.length; index++) {
                const text = elements[index].textContent;
                if (text.includes('Over') && text.includes('Points')) {
                    data.push(text);
                }
            }
            return data;
        });
        await browser.close();
        _browser = undefined;
        return resolve(data);
    } catch (error) {
        return reject(error);
    }
}

module.exports = {
    getPlayerMarkets
}