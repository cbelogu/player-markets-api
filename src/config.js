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
  },
  LADBROKES: {
    BASE_URL: 'https://www.ladbrokes.com.au',
    NBA_MATCHES_URL: 'https://www.ladbrokes.com.au/sports/basketball/usa/nba',
  },
  BET365: {
    PLAYER_POINTS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181378/F43/',
    PLAYER_REBOUNDS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181380/F43/',
    PLAYER_ASSISTS_URL: 'https://www.bet365.com.au/#/AC/B18/C20604387/D43/E181379/F43/'
  },
  SPORTSBET_BASE_URL: 'https://www.sportsbet.com.au/apigw/sportsbook-sports/Sportsbook/Sports',
  SPORTSBET_NBA_COMPETITION_ID: 6927,
  SPORTSBET_PLAYER_MARKET_ID: 567,
  SPORTSBET_REBOUNDS_MARKET_ID: 609,
  SPORTSBET_ASSISTS_MARKET_ID: 610,
  BETEASY_NBA_MATCHES_URL: 'https://beteasy.com.au/api/sports/navigation/basketball/nba/nba-matches',
  BETEASY_PLAYERPROP_URL: 'https://beteasy.com.au/api/sports/event-group/?id={eventId}&ecGroupOrderByIds%5B%5D=18',
};

module.exports = {
  config,
};
