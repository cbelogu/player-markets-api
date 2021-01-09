const puppeteer = require('puppeteer');
const devices = puppeteer.devices;
const iphoneX = devices['iPhone X'];
const _cache = require('../client/cacheManager').cacheManager;
const { config } = require('../config');
const $ = require('cheerio');
const { getBrowser } = require('../client/browser');
const { get } = require('../client/httpClient');
const { request } = require('./bet365ApiClient');

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
    if (!config.BET365.ENABLE_BET365) {
        return Promise.resolve([]);
    }
    _cacheKey = `${config.BET365.CACHEKEY}${marketType}`;
    const teams = matchName.split(' At ');
    matchName = teamNameMappings[teams[0]] + ' @ ' + teamNameMappings[teams[1]];
    const cachedData = _cache.get(_cacheKey);
    if (cachedData) {
        console.log('BET365 - READING DATA FROM CACHE, HURRAY');
        return Promise.resolve(cachedData.find(match => match.matchName === matchName));
    }

    console.log('BET365 - NO DATA IN CACHE.... FETCHING FROM SERVER');

    return config.BET365.USEAPICALL
        ? getDataUsingApi(marketType)
            .then((matches) => {
                const data = matches.find(match => match.matchName === matchName);
                // console.log(`data to return in string format : ${JSON.stringify(matches)}`);
                return data;
            })
            .catch((err) => {
                console.log(err);
                // return reject(err);
            })
        : getBrowser()
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

function getUrl(marketType, useApiForData = false) {
    switch (marketType) {
        case 1:
            return useApiForData ? config.BET365.API_PLAYER_POINTS_URL : config.BET365.PLAYER_POINTS_URL;
        case 2:
            return useApiForData ? config.BET365.API_PLAYER_REBOUNDS_URL : config.BET365.PLAYER_REBOUNDS_URL;
        case 3:
            return useApiForData ? config.BET365.API_PLAYER_ASSISTS_URL : config.BET365.PLAYER_ASSISTS_URL;
        case 4:
            return useApiForData ? config.BET365.API_PLAYER_PRA : config.BET365.PLAYER_PRA;
        default:
            throw new Error(`marketType should be 1 or 2 or 3. Invalid value passed: ${marketType}`);
    }
}

function formatData(data) {
    const rawMessage = data;
    var split, glit = [];
    var splitArr = rawMessage.split('|')
    splitArr = splitArr.sort();
    for (split of splitArr) {
        //console.log(split)
        var PA = split.indexOf('PA');
        var MA = split.indexOf('MA');
        var CL = split.indexOf('CL');
        var MG = split.indexOf('MG');
        var EV = split.indexOf('EV');

        if (EV == 0) {
            try {
                var obj = split.replace(/EV;/gi, '{ "type":"getEvent","data":{"').replace(/=/gi, `":"`).replace(/;/gi, `","`).slice(0, -2) + '} }'
                glit.push(JSON.parse(obj))
            } catch (e) {
                var obj = { error: 'Erro' }
            }
        }

        if (PA == 0) {
            try {
                var obj = split.replace(/PA;/gi, '{ "type":"eventPlay","data":{"').replace(/=/gi, `":"`).replace(/;/gi, `","`).slice(0, -2) + '} }'
                glit.push(JSON.parse(obj))
            } catch (e) {
                var obj = { error: 'Erro' }
            }
        }

        if (MA == 0) {
            try {
                var obj = split.replace(/MA;/gi, '{ "type":"eventMatch","data":{"').replace(/=/gi, `":"`).replace(/;/gi, `","`).slice(0, -2) + '} }'
                glit.push(JSON.parse(obj))
            } catch (e) {
                var obj = { error: 'Erro' }
            }
        }

        if (CL == 0) {
            try {
                var obj = split.replace(/CL;/gi, '{ "type":"clain","data":{"').replace(/=/gi, `":"`).replace(/;/gi, `","`).slice(0, -2) + '} }'
                glit.push(JSON.parse(obj))
            } catch (e) {
                var obj = { error: 'Erro' }
            }
        }

        if (MG == 0) {
            try {
                var obj = split.replace(/MG;/gi, '{ "type":"magic","data":{"').replace(/=/gi, `":"`).replace(/;/gi, `","`).slice(0, -2) + '} }'
                glit.push(JSON.parse(obj))
            } catch (e) {
                var obj = { error: 'Erro' }
            }
        }
    }

    return glit;
}

async function getDataUsingApi(marketType) {
    return request(getUrl(marketType, true)).then((response) => {
        const formattedResponse = formatData(response.data);
        const matches = [];
        const data = response.data.split(marketType === 4 ? 'SY=cw;NA=' : 'SY=fe;NA=');
        if (data && data.length && data.length === 1) {
            console.log('markets not open yet');
            return matches;
        }
        data.shift(); // removes the first element which is an array
        const splitter = marketType === 4 ? ';HA=' : ';NA=';
        for (let index = 0; index < data.length; index++) {
            const matchData = data[index].split('CN=1;FF=;');
            const matchName = matchData[0].split(';')[0];
            const playersList = matchData[1].split(';NA=').slice(1, -1).map(item => item.split(';')[0]);
            const overOdds = matchData[2].split(splitter).slice(1, -1).map(item => item.split(';')[0]);

            const match = {
                matchName,
                players: playersList.map((player, index) => ({
                    playerName: player,
                    handiCap: overOdds[index],
                    overPrice: 1.00,
                    underPrice: 1.00
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
        return matches;
    }).catch(console.log);
    // let cookie = await getBrowserCookie();
    // return get(getUrl(marketType, true), {
    //     headers: {
    //         'Accept': '*/*',
    //         'X-Requested-With': 'XMLHttpRequest',
    //         'Accept-Encoding': 'gzip, deflate, br',
    //         'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    //         'Cache-Control': 'no-cache',
    //         'Connection': 'keep-alive',
    //         'Content-Length': 178,
    //         'Content-type': 'application/x-www-form-urlencoded',
    //         'Host': 'www.bet365.com.au',
    //         'Origin': 'https://www.bet365.com',
    //         'Pragma': 'no-cache',
    //         'Referer': 'https://www.bet365.com.au/',
    //         'Sec-Fetch-Dest': 'empty',
    //         'Sec-Fetch-Mode': 'cors',
    //         'Sec-Fetch-Site': 'same-site',
    //         'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
    //     }
    // })
    //     .then((response) => {
    //         console.log(response);
    //         const matches = [];
    //         const data = response.data.split(marketType === 4 ? 'SY=cw;NA=' : 'SY=cbn;NA=');
    //         if (data && data.length && data.length === 1) {
    //             console.log('markets not open yet');
    //             return matches;
    //         }
    //         data.shift(); // removes the first element which is an array
    //         const splitter = marketType === 4 ? ';HA=' : ';NA=';
    //         for (let index = 0; index < data.length; index++) {
    //             const matchData = data[index].split('CN=1;FF=;');
    //             const matchName = matchData[0].split(';')[0];
    //             const playersList = matchData[1].split(';NA=').slice(1, -1).map(item => item.split(';')[0]);
    //             const overOdds = matchData[2].split(splitter).slice(1, -1).map(item => item.split(';')[0]);

    //             const match = {
    //                 matchName,
    //                 players: playersList.map((player, index) => ({
    //                     playerName: player,
    //                     handiCap: overOdds[index],
    //                     overPrice: 1.00,
    //                     underPrice: 1.00
    //                 }))
    //             };

    //             matches.push(match);
    //         }

    //         // store the data in cache
    //         console.log('BET365 Matches Array ' + JSON.stringify(matches));
    //         if (matches.length > 0) {
    //             console.log('BET365 - STORING DATA IN CACHE');
    //             const success = _cache.set(_cacheKey, matches);
    //             if (success) console.log('BET365 - DATA STORED IN CACHE');
    //         }
    //         return matches;
    //     })
    //     .catch((error) => {
    //         console.log(error);
    //         return [];
    //     })
}

async function extractMarkets(browser, marketType, resolve, reject) {
    try {
        const page = (await browser.pages())[0];
        await page.emulate(iphoneX);
        const url = getUrl(marketType);
        console.time(`navigating to url ${url}`);
        await page.goto(url, {
            timeout: 30000,
            waitUntil: ['domcontentloaded', 'networkidle2', 'load']
        });
        console.timeEnd(`navigating to url ${url}`);
        const contentDivsSelector = 'div.gl-MarketGroupContainer.gl-MarketGroupContainer_HasLabels > div';
        const bettingSuspendedSelector = 'div.cl-BettingSuspendedScreen ';
        console.time('page load wait...');
        const waitOptions = { timeout: config.BROWSER.WAIT_TIMEOUT, visible: true };
        try { // check for suspended message
            const suspendMessageDivCount = await page.$$eval(bettingSuspendedSelector, (elements) => {
                return elements && elements.length;
            });
            console.log(`suspended message count is : ${suspendMessageDivCount}`);
            if (suspendMessageDivCount === 1) {
                console.log('Bet 365 markets suspended...');
                console.timeEnd('page load wait...');
                return resolve([]);
            }
            await page.waitForSelector(contentDivsSelector, waitOptions);
        } catch (error) {
            // await page.screenshot({ fullpage: true, path: './bet365.png'});
            console.log(JSON.stringify(error));
        }
        let retryCount = 0;
        let divsCount = 0;
        while (retryCount < 3 && divsCount === 0) {
            console.log(`waiting... retry count is : ${retryCount}`);
            await sleep(250);
            divsCount = await page.$$eval(contentDivsSelector, (elements) => {
                return elements && elements.length;
            });
            retryCount++;
        }
        console.timeEnd('page load wait...');
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

async function getBrowserCookie() {
    return getBrowser()
        .then((browser) => {
            return new Promise((resolve, reject) => {
                getCookie(browser, resolve, reject);
            });
        })

    async function getCookie(browser, resolve, reject) {
        try {
            const page = await browser.newPage();
            await page.emulate(iphoneX);
            await page.goto(`https://bet365.com.au`);
            await sleep(500);
            const cookies = await page.cookies();
            return resolve(`rmbs=3; aps03=${cookies[1].value}; session=processform=0; pstk=${cookies[0].value}`);
        } catch (error) {
            return resolve('');
        }
    }
}

module.exports = {
    getPlayerMarkets
}