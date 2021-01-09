const config = {
  SPORTSBET: {
    BASE_URL: 'https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports',
    NBA_COMPETITION_ID: 6927,
    PLAYER_MARKET_ID: 567,
    REBOUNDS_MARKET_ID: 609,
    ASSISTS_MARKET_ID: 610,
    PRA_MARKET_ID: 570
  },
  BETEASY: {
    NBA_MATCHES_URL: 'https://beteasy.com.au/api/sports/navigation/basketball/nba/nba-matches',
    PLAYERPROP_URL: 'https://beteasy.com.au/api/sports/event-group/?id={eventId}&ecGroupOrderByIds%5B%5D={marketId}',
    PLAYER_POINTS: ' Points Over/Under',
    PLAYER_REBOUNDS: ' Rebounds Over/Under',
    PLAYER_ASSISTS: ' Assists Over/Under',
    PLAYER_PRA: ' Points + Rebounds + Assists Over/Under',
    CACHEKEY_NBA_MATCHES_URL: 'betEasyMatchesUrlKey',
    CACHEKEY_EVENT: 'betEasy_EventID_',
  },
  LADBROKES: {
    BASE_URL: 'https://www.ladbrokes.com.au',
    NBA_MATCHES_URL: 'https://www.ladbrokes.com.au/sports/basketball/usa/nba',
    CACHEKEY_NBA_MATCHES_URL: 'Ladbrokes_Match_Urls',
    CACHEKEY_MATCH: 'Ladbrokes_Match_Markets_',
  },
  BET365: {
    PLAYER_POINTS_URL: 'https://bet365.com.au/#/AC/B18/C20604387/D43/E181378/F43/',
    PLAYER_REBOUNDS_URL: 'https://bet365.com.au/#/AC/B18/C20604387/D43/E181380/F43/',
    PLAYER_ASSISTS_URL: 'https://bet365.com.au/#/AC/B18/C20604387/D43/E181379/F43/',
    PLAYER_PRA: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181390/F43/',
    API_PLAYER_POINTS_URL: 'https://www.bet365.com.au/SportsBook.API/web?lid=30&zid=0&pd=%23AC%23B18%23C20604387%23D43%23E181378%23F43%23&cid=13&ctid=13',
    API_PLAYER_REBOUNDS_URL: 'https://www.bet365.com.au/SportsBook.API/web?lid=30&zid=0&pd=%23AC%23B18%23C20604387%23D43%23E181380%23F43%23&cid=13&ctid=13',
    API_PLAYER_ASSISTS_URL: 'https://www.bet365.com.au/SportsBook.API/web?lid=30&zid=0&pd=%23AC%23B18%23C20604387%23D43%23E181379%23F43%23&cid=13&ctid=13',
    API_PLAYER_PRA: 'https://www.bet365.com.au/SportsBook.API/web?lid=30&zid=0&pd=%23AC%23B18%23C20604387%23D43%23E181390%23F43%23&cid=13&ctid=13',
    CACHEKEY: 'Bet365Markets_',
    USEAPICALL: true,
    ENABLE_BET365: true,
  },
  POINTSBET: {
    NBA_MATCHES_URL: 'https://api.pointsbet.com/api/v2/competitions/7176/events/featured?includeLive=true',
    EVENTS_URL: 'https://api.pointsbet.com/api/v2/events/{eventId}',
    CACHEKEY_NBA_MATCHES_URL: 'PointsBet_Match_Urls',
    CACHEKEY_MATCH: 'PointsBet_Match_Markets_',
    PLAYER_POINTS: /(Home|Away) Player [A-Z]{1} Points Over\/Under/,
    PLAYER_REBOUNDS: /(Home|Away) Player [A-Z]{1} Rebounds Over\/Under/,
    PLAYER_ASSISTS: /(Home|Away) Player [A-Z]{1} Assists Over\/Under/,
    PLAYER_PRA: /(Home|Away) Player [A-Z]{1} Pts \+ Rebs \+ Asts Over\/Under/,
  },
  BROWSER: {
    WAIT_TIMEOUT: 10000,
  },
};

module.exports = {
  config,
};
