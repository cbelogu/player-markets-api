const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];

const $ = require('cheerio');

const url = 'https://www.ladbrokes.com.au/sports/basketball/usa/nba';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getMatchUrl(matchName) {
    const namesArray = matchName.split(' At ');
    const formattedName = String(namesArray[1] + ' v ' + namesArray[0]).replace(/\s/g, '-').replace('76ers', '76-ers').toLowerCase();
    console.log(formattedName);
    return puppeteer
        .launch({ headless: true })
        .then((browser) => {
            return new Promise((resolve, reject) => {
                extractUrls(browser, formattedName, resolve, reject);
            });
        })
        .then(result => result)
        .catch(function (err) {
            throw new Error(err);
        });
};

async function extractUrls(browser, formattedName, resolve, reject) {
    try {
        const page = await browser.newPage();
        await page.emulate(iphoneX);
        await page.goto(url);
        await sleep(2000);
        const html = await page.content();
        const urls = [];
        const links = $('.sports-event-entry-with-markets > a', html);
        for (let index = 0; index < links.length; index++) {
            const element = links[index];
            urls.push(element.attribs.href);
        }
        console.log(`urls are ${urls}`);
        await browser.close();
        return resolve(urls.find((e) => e.includes(formattedName)));
    } catch (error) {
        return reject(error);
    }
}

async function getPlayerMarkets(matchName) {
    const path = await getMatchUrl(matchName);
    const url = `https://www.ladbrokes.com.au${path}`;
    console.log(`final url is ${url}`);
    return puppeteer
        .launch({ headless: true })
        .then((browser) => {
            return new Promise((resolve, reject) => {
                extractMarkets(browser, url, resolve, reject);
            });
        })
        .then((data) => {
            const playerMarkets = [];
            for (let index = 0; index < data.length; index++) {
                const market = data[index];
                const props = market.trim().split('\n');
                const playerName = props[0].split('Over')[0].trim();
                const handicap = props[0].split('Over')[1].trim().replace(' Points', '').trim();
                const selections = [];
                selections.push({
                    propName: 'Over',
                    handicap: handicap,
                    price: props[1].trim()
                });
                selections.push({
                    propName: 'Under',
                    handicap: handicap,
                    price: props[3].trim()
                });
                const playerMarket = {
                    name: playerName,
                    selections: selections
                };
                playerMarkets.push(playerMarket);
            }
            return playerMarkets;
        })
        .catch((err) => {
            console.log(err);
            return [];
        });
}

// console.log(getPlayerMarkets('Phoenix Suns At New Orleans Pelicans').then(console.log));

async function extractMarkets(browser, url, resolve, reject) {
    try {
        const page = await browser.newPage();
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
        return resolve(data);
    } catch (error) {
        return reject(error);
    }
}

module.exports = {
    getPlayerMarkets
}