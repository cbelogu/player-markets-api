const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const iphoneX = devices['iPhone X'];
const _cache = require('../client/cacheManager').cacheManager;

const $ = require('cheerio');

const url = 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181378/F43/';
const cacheKey = 'Bet365Markets';

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getPlayerMarkets(matchName) {
    const teams = matchName.split(' At ');
    matchName = teamNameMappings[teams[0]] + ' @ ' + teamNameMappings[teams[1]];
    const cachedData = _cache.get(cacheKey);
    if (cachedData) {
        console.log('BET365 - READING DATA FROM CACHE, HURRAY');
        return Promise.resolve(cachedData.find(match => match.matchName === matchName));
    }

    console.log('BET365 - NO DATA IN CACHE.... FETCHING FROM SERVER');
    return puppeteer
        .launch({args: ['--no-sandbox', '--disable-setuid-sandbox']})
        .then((browser) => {
            return new Promise((resolve, reject) => {
                extractMarkets(browser, resolve, reject);
            });
        })
        .then((matches) => {
            const data = matches.find(match => match.matchName === matchName);
            console.log(JSON.stringify(data));
            return data;
        })
        .catch((err) => {
            console.log(err);
            // return reject(err);
        });
}

async function extractMarkets(browser, resolve, reject) {
    try {
        const page = await browser.newPage();
        await page.emulate(iphoneX);
        await page.goto(url);
        await sleep(1250);
        const html = await page.content();
        const contentDivs = $('div.gl-MarketGroupContainer.gl-MarketGroupContainer_HasLabels > div', html);
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
        console.log('BET365 - STORING DATA IN CACHE');
        const success = _cache.set(cacheKey, matches);
        if (success) console.log('BET365 - DATA STORED IN CACHE');
        return resolve(matches);
    } catch (error) {
        return reject(error);
    }
}

module.exports = {
    getPlayerMarkets
}