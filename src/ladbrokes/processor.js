const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];
const _cache = require('../client/cacheManager').cacheManager;
const { config } = require('../config');
const $ = require('cheerio');

const CACHEKEY_URLS = 'Ladbrokes_Match_Urls';
const CACHEKEY_MATCH = 'Ladbrokes_Match_Markets_';

let _browser = undefined;

async function getMatchUrl(matchName) {
    const namesArray = matchName.split(' At ');
    const formattedName = String(namesArray[1] + ' v ' + namesArray[0]).replace(/\s/g, '-').replace('76ers', '76-ers').toLowerCase();
    console.log(formattedName);
    const cachedData = _cache.get(CACHEKEY_URLS);
    if (cachedData) return Promise.resolve(cachedData.find((e) => e.includes(formattedName)));

    return puppeteer
        .launch({ headless: false, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
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
        await page.goto(config.LADBROKES.NBA_MATCHES_URL);
        await page.waitForSelector('.sports-event-entry-with-markets > a', { visible: true });
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

function getMarketParams(marketType) {
    switch (marketType) {
        case 1:
            return { name: 'player point markets', propName: 'Player Points O/U' };
        case 2:
            return { name: 'player rebounds markets', propName: 'Player Rebounds O/U' };
        case 3:
            return { name: 'player assists markets', propName: 'Player Assists O/U' };
        default:
            throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
    }
}

async function getPlayerMarkets(matchName, marketType) {
    // return Promise.resolve([]);
    const path = await getMatchUrl(matchName);
    if (!path) {
        console.log('UNABLE to find url for ladbrokes match ' + matchName);
        return Promise.resolve([]);
    }
    const url = `${config.LADBROKES.BASE_URL}${path}`;
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
                extractMarkets(browser, url, marketType, resolve, reject);
            });
        })
        .then((data) => {
            // console.log('Caching Ladbrokes Match Data for ' + cacheKey);
            // _cache.set(cacheKey, data);
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

async function extractMarkets(browser, url, marketType, resolve, reject) {
    try {
        const { name, propName } = getMarketParams(marketType);
        const page = (await browser.pages())[0];
        await page.emulate(iphoneX);
        await page.goto(url);
        const marketsSelector = 'div.accordion__title.accordion-markets__title>h3>span';
        await page.waitForSelector(marketsSelector, { visible: true });
        await page.$$eval(marketsSelector, (elements, _name) => {
            console.log('lol....' + _name);
            const reg = new RegExp(_name, 'i');
            let index = elements.findIndex(e => reg.test(e.textContent));
            if (index !== -1) {
                elements[index].click();
                return;
            }
        }, name);
        await page.$$eval('div.accordion__title.accordion-markets-nested__title.collapsed', (elements, _propName) => {
            console.log('meow...' + _propName);
            for (let index = 0; index < elements.length; index++) {
                const element = elements[index];
                if (element.textContent.includes(_propName)) {
                    element.click();
                    console.log(element.textContent);
                }
            }
        }, propName);
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