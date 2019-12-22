const config = {
  SPORTSBET: {
    BASE_URL: 'https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports',
    NBA_COMPETITION_ID: 6927,
    PLAYER_MARKET_ID: 567,
    REBOUNDS_MARKET_ID: 609,
    ASSISTS_MARKET_ID: 610,
  },
  BETEASY: {
    NBA_MATCHES_URL: 'https://beteasy.com.au/api/sports/navigation/basketball/nba/nba-matches',
    PLAYERPROP_URL: 'https://beteasy.com.au/api/sports/event-group/?id={eventId}&ecGroupOrderByIds%5B%5D=18',
    PLAYER_POINTS: ' Points Over/Under',
    PLAYER_REBOUNDS: ' Rebounds Over/Under',
    PLAYER_ASSISTS: ' Assists Over/Under',
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
    PLAYER_POINTS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181378/F43/',
    PLAYER_REBOUNDS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181380/F43/',
    PLAYER_ASSISTS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181379/F43/',
    CACHEKEY: 'Bet365Markets_',
  },
  BROWSER: {
    WAIT_TIMEOUT: 5000,
  },
};

module.exports = {
  config,
};
