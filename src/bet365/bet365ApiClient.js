const axios = require('axios').default;
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const touchCookie = require('tough-cookie');

axiosCookieJarSupport(axios);
const cookieJar = new touchCookie.CookieJar();

var header = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1',
  Cookie: `aps03=cf=N&cg=1&cst=0&ct=13&hd=N&lng=30&tzi=30`
};


const url = 'https://www.bet365.com.au/';

let api = axios.create({
  headers: header,
  url: url,
  withCredentials: true,
  jar: cookieJar
});

const request = (path) => {
  return new Promise((resolve, reject) => {
    api.get(`${url}defaultapi/sports-configuration`).then((defaults) => {
      console.log(defaults.data)
      let app = axios.create({
        url: url,
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'max-age=0',
          'Connection': 'keep-alive',
          'Cookie': `aps03=ao=2&cf=E&cg=${defaults.data.flashvars.CUSTOMER_TYPE}&cst=0&ct=${defaults.data.flashvars.REGISTERED_COUNTRY_CODE}&hd=Y&lng=${defaults.data.flashvars.LANGUAGE_ID}&oty=2&tt=2&tzi=16; pstk=${defaults.data.flashvars.SESSION_ID}${defaults.data.flashvars.COOKIE_SECURITY_LEVEL}`,
          'Host': `${defaults.data.flashvars.DOMAIN_URL}`,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': 1,
          'User-Agent': `${defaults.data.ns_weblib_util.WebsiteConfig.DEFAULT_USERAGENT}`

        },
        jar: cookieJar,
        withCredentials: true
      })

      app.get(path).then((rest) => {
        return resolve(rest);
      }).catch((e) => {
        return reject(e)
      });

    }).catch((e) => {
      return reject(e)
    })
  })
};

module.exports = { request };
