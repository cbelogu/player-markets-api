const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];
const _cache = require('../client/cacheManager').cacheManager;
const { config } = require('../config');
const $ = require('cheerio');
const { getBrowser } = require('../client/browser');

let _cacheKey = '';
const teamNameMappings = {
    'Atlanta Hawks': 'ATL Hawks',
    'Boston Celtics': 'BOS Celtics',
    'Brooklyn Nets': 'BKN Nets',
    'Charlotte Hornets': 'CHA Hornets',
    'Chicago Bulls': 'CHI Bulls',
    'Cleveland Cavaliers': 'CLE Cavaliers',
    'Dallas Mavericks': 'DAL Mavericks',
    'Denver Nuggets': 'DEN Nuggets',
    'Detroit Pistons': 'DET Pistons',
    'Golden State Warriors': 'GS Warriors',
    'Houston Rockets': 'HOU Rockets',
    'Indiana Pacers': 'IND Pacers',
    'Los Angeles Clippers': 'LA Clippers',
    'Los Angeles Lakers': 'LA Lakers',
    'Memphis Grizzlies': 'MEM Grizzlies',
    'Miami Heat': 'MIA Heat',
    'Milwaukee Bucks': 'MIL Bucks',
    'Minnesota Timberwolves': 'MIN Timberwolves',
    'New Orleans Pelicans': 'NO Pelicans',
    'New York Knicks': 'NY Knicks',
    'Oklahoma City Thunder': 'OKC Thunder',
    'Orlando Magic': 'ORL Magic',
    'Philadelphia 76ers': 'PHI 76ers',
    'Phoenix Suns': 'PHX Suns',
    'Portland Trail Blazers': 'POR Trail Blazers',
    'Sacramento Kings': 'SAC Kings',
    'San Antonio Spurs': 'SA Spurs',
    'Toronto Raptors': 'TOR Raptors',
    'Utah Jazz': 'UTA Jazz',
    'Washington Wizards': 'WAS Wizards'
};

async function sleep(timeout = 500) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    });
}

async function getPlayerMarkets(matchName, marketType) {
    _cacheKey = `${config.BET365.CACHEKEY}${marketType}`;
    const teams = matchName.split(' At ');
    matchName = teamNameMappings[teams[0]] + ' @ ' + teamNameMappings[teams[1]];
    const cachedData = _cache.get(_cacheKey);
    if (cachedData) {
        console.log('BET365 - READING DATA FROM CACHE, HURRAY');
        return Promise.resolve(cachedData.find(match => match.matchName === matchName));
    }

    console.log('BET365 - NO DATA IN CACHE.... FETCHING FROM SERVER');
    return getBrowser()
        .then((browser) => {
            return new Promise((resolve, reject) => {
                extractMarkets(browser, marketType, resolve, reject);
            });
        })
        .then((matches) => {
            const data = matches.find(match => match.matchName === matchName);
            // console.log(`data to return in string format : ${JSON.stringify(matches)}`);
            return data;
        })
        .catch((err) => {
            console.log(err);
            // return reject(err);
        });
}

function getUrl(marketType) {
    switch (marketType) {
        case 1:
            return config.BET365.PLAYER_POINTS_URL;
        case 2:
            return config.BET365.PLAYER_REBOUNDS_URL;
        case 3:
            return config.BET365.PLAYER_ASSISTS_URL;
        default:
            throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
    }
}

async function extractMarkets(browser, marketType, resolve, reject) {
    try {
        const page = (await browser.pages())[0];
        await page.emulate(iphoneX);
        const url = getUrl(marketType);
        console.time(`navigating to url ${url}`);
        await page.goto(url, {
            timeout: config.BROWSER.WAIT_TIMEOUT,
            waitUntil: ['domcontentloaded', 'networkidle2', 'load']
        });
        console.timeEnd(`navigating to url ${url}`);
        const contentDivsSelector = 'div.gl-MarketGroupContainer.gl-MarketGroupContainer_HasLabels > div';
        // const bettingSuspendedSelector = 'div.cl-BettingSuspendedScreen ';
        console.time('starting wait...');
        const waitOptions = { timeout: config.BROWSER.WAIT_TIMEOUT, visible: true };
        try {
            await page.waitForSelector(contentDivsSelector, waitOptions);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
        let retryCount = 0;
        let divsCount = 0;
        while (retryCount < 3 && divsCount === 0) {
            await sleep(250);
            divsCount = await page.$$eval(contentDivsSelector, (elements) => {
                return elements && elements.length;
            });
            retryCount++;
        }
        console.timeEnd('starting wait...');
        console.log(`page returned ${divsCount} number of divs`);

        const html = await page.content();
        // console.log(`page content retrieved successfully ... - ${html}`);
        const contentDivs = $(contentDivsSelector, html);
        // console.log(`html for requested bet 365 page is ${contentDivs}`);
        const matches = [];
        for (let index = 0; index < contentDivs.length; index = index + 4) {
            const matchName = $('div.cm-MarketSubGroup_Label ', contentDivs[index]).text();

            const playersList = $('span.cm-ParticipantLabelWithTeamName_Name', contentDivs[index + 1])
                .map((i, item) => $(item).text()).toArray();

            const handicapList = $('span.cm-ParticipantCenteredAndStacked_Handicap', contentDivs[index + 2])
                .map((i, item) => $(item).text()).toArray();

            const overOdds = $('span.cm-ParticipantCenteredAndStacked_Odds', contentDivs[index + 2])
                .map((i, item) => $(item).text()).toArray();

            const underOdds = $('span.cm-ParticipantCenteredAndStacked_Odds', contentDivs[index + 3])
                .map((i, item) => $(item).text()).toArray();

            const match = {
                matchName,
                players: playersList.map((player, index) => ({
                    playerName: player,
                    handiCap: handicapList[index],
                    overPrice: overOdds[index],
                    underPrice: underOdds[index]
                }))
            };

            matches.push(match);
        }
        // store the data in cache
        console.log('BET365 Matches Array ' + JSON.stringify(matches));
        if (matches.length > 0) {
            console.log('BET365 - STORING DATA IN CACHE');
            const success = _cache.set(_cacheKey, matches);
            if (success) console.log('BET365 - DATA STORED IN CACHE');
        }
        return resolve(matches);
    } catch (error) {
        console.log(`error while fetching bet 365 markets... ${JSON.stringify(error)}`);
        return reject(error);
    }
}

module.exports = {
    getPlayerMarkets
}