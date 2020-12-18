import { format, parse } from 'url'
import { DEFAULT_ACTIVITY_TIMEOUT, DEFAULT_TIMEOUT } from './_TestBuilder'
import { TestScript, testScript } from './_TestScript'
import { URL } from 'url';
import credentials from './credentials'

export class TestScriptBuilder {
  /**
   * @param url             The competitor's URL to test.
   * @param appName         The name of the app to be blocked.
   * @param location        The location where the test is executed.
   * @param isMobile        true if the mobile site is tested, false otherwise.
   * @param activityTimeout The activity timeout.
   * @param cookie         The cookie string to be set.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForCompetitorTest(
    url: string,
    appName: string | null,
    location: string,
    isMobile: boolean,
    activityTimeout: number,
    cookie: string,
    timeout: number
  ): TestScript {
    if (/https:\/\/\w*:\w*@oleo.io/.test(url)) {
      activityTimeout = 5000;
    }

    const blockDomains: string[] = []
    if (appName) {
      blockDomains.push(`${appName}.app.baqend.com`)
    }

    /*if (speedKitConfig !== null && typeof speedKitConfig !== 'string') {
      if (speedKitConfig.appDomain) {
        blockDomains.push(speedKitConfig.appDomain)
      } else {
        blockDomains.push(`${speedKitConfig.appName}.app.baqend.com`)
      }
    }*/

    const ts = testScript()

    this.addCookies(ts, cookie, url);

    if (isMobile) {
    //   ts.setViewport(480, 987); // Maximum viewport
    } else {
      ts.setViewport(1366, 768); // Good desktop viewport
    }

    // Hack to circumvent zip code protection for "shop.rewe.de"
    if (url.startsWith('https://shop.rewe.de/')) {
      // Cookies to choose a marked
      ts.setCookie('marketsCookie=%7B%22marketId%22%3A%22540622%22%2C%22zipCode%22%3A%2225337%22%2C%22serviceTypes%22%3A%5B%22PICKUP%22%5D%2C%22customerZipCode%22%3A%2225337%22%2C%22marketZipCode%22%3A%2225336%22%7D', 'https://shop.rewe.de/');
      ts.setCookie('cookie-consent=1', 'https://shop.rewe.de/');
    }

    if (url.startsWith('https://www.snipes.com')) {
      ts.setCookie('customerCountry=de', 'https://www.snipes.com/');
    }

    if (url.startsWith('https://eu.puma.com/')) {
      ts.setCookie('pumacookies=1', 'https://eu.puma.com/');
    }

    if (url.startsWith('https://www.mediamarkt.de/')) {
      ts.setCookie('MC_PRIVACY=marketing', 'https://www.mediamarkt.de/');
    }
    if (url.startsWith('https://www.t-systems.com/')) {
      ts.setCookie('CONSENTMGR=ts:1592571089406%7Cconsent:false', 'https://www.t-systems.com/');
    }
    if (url.startsWith('https://www.casinos.at/')) {
      ts.setCookie('JSESSIONID=DDC555B0A8FFE4543CA22A6F7F603C9E', 'https://www.casinos.at/');
      ts.setCookie('cookiesession1=355763B9ABVRC492QMDBNUY23M5F0ADB', 'https://www.casinos.at/');
    }
    if (url.startsWith('https://shop.casinos.at/')) {
      ts.setCookie('XTCsid=306a128cd40c0c54cdf536c15282ef03', 'https://shop.casinos.at/');
      ts.setCookie('cookiesession1=355763B9ABVRC492QMDBNUY23M5F0ADB', 'https://shop.casinos.at/');
    }
    if (url.startsWith('https://www.continente.pt/')) {
      ts.setCookie('smartbanner-closed=true', 'https://www.continente.pt/');
    }
    if (url.startsWith('https://www.birkenstock.com/')) {
      ts.setCookie('privacy_settings=gtm_googleanalytics|platformpersonalization|youtube|shoesizeme|vimeo|__olapicU|gender|gtm_bing|gtm_sfmc-predictive|gtm_affilinet|gtm_ga-advertising|gtm_adwords|gtm_facebook|dynamicyield', 'https://www.birkenstock.com/');
      ts.setCookie('privacy_level=off|off', 'https://www.birkenstock.com/');
    }
    if (url.startsWith('https://de.tommy.com/')) {
      ts.setCookie('PVH_COOKIES_GDPR=Accept', 'https://de.tommy.com/');
      ts.setCookie('PVH_COOKIES_GDPR_SOCIALMEDIA=Reject', 'https://de.tommy.com/');
      ts.setCookie('PVH_COOKIES_GDPR_ANALYTICS=Reject', 'https://de.tommy.com/');
    }
    if (url.startsWith('https://www.ernstings-family.de/')) {
      ts.setCookie('TC_PRIVACY_CENTER=ALL', 'https://www.ernstings-family.de/');
      ts.setCookie('TC_PRIVACY=1@009@ALL@@1593418821237@', 'https://www.ernstings-family.de/');
    }
    if (url.startsWith('https://de.iqos.com/')) {
      ts.setCookie('dw_Advertisement_cookie=opt-out', 'https://de.iqos.com/');
      ts.setCookie('time_cookies_accepted=1593419068409', 'https://de.iqos.com/');
      ts.setCookie('cookies_accepted=1', 'https://de.iqos.com/');
      ts.setCookie('dw_Technical_cookie=opt-out', 'https://de.iqos.com/');
      ts.setCookie('iqos-skip-home-animations=yes', 'https://de.iqos.com/');
      ts.setCookie('iqos-age-verified=yes', 'https://de.iqos.com/');
    }
    if (url.startsWith('https://www.gelsenwasser.de/')) {
      ts.setCookie('cookie_optin=essential:1|c0001:0|c0002:0', 'https://www.gelsenwasser.de/');
    }
    if (url.startsWith('https://www.ibm.com/')) {
      ts.setCookie('cmapi_cookie_privacy=permit_1_required', 'https://www.ibm.com/');
      ts.setCookie('notice_preferences=0:', 'https://www.ibm.com/');
      ts.setCookie('notice_gdpr_prefs=0:', 'https://www.ibm.com/');
      ts.setCookie('notice_behavior=expressed|eu', 'https://www.ibm.com/');
      ts.setCookie('cm-proactive-state={%22type%22:%22proactiveInvite%22%2C%22state%22:-1}', 'https://www.ibm.com/');
    }
    if (url.startsWith('https://www.barclaycard.de/')) {
      ts.setCookie('bcConsent={"Statistik":false,"Personalisierung":false,"exp":"2020-8-28"}', 'https://www.barclaycard.de/');
    }

    if (url.startsWith('https://mobil.krone.at/')) {
      ts.setCookie('krn_consent_shown=1', 'https://mobil.krone.at/');
      ts.setCookie('krn_cons_ads=1', 'https://mobil.krone.at/');
      ts.setCookie('_gat_fxfTracker=1', 'https://mobil.krone.at/');
      ts.setCookie('krn_cons_content=1', 'https://mobil.krone.at/');
      ts.setCookie('POPUPCHECK=1593507473928', 'https://mobil.krone.at/');
    }
    if (url.startsWith('https://www.krone.at/')) {
      ts.setCookie('krn_consent_shown=1', 'https://www.krone.at/');
      ts.setCookie('krn_cons_ads=1', 'https://www.krone.at/');
      ts.setCookie('_gat_fxfTracker=1', 'https://www.krone.at/');
      ts.setCookie('krn_cons_content=1', 'https://www.krone.at/');
      ts.setCookie('POPUPCHECK=1593507473928', 'https://www.krone.at/');
    }
    if (url.startsWith('https://www.auchan.pt/')) {
      ts.setCookie('AUCHANCOOKIE=id=e7e4652f-3a17-4503-9385-f06330d0f8af&an=1&pl=0&nl=False&se=637290393050549806&b=28edeffc-553e-42b7-b892-58830141473e&ProductsInBasket=&LastBasketUpdate=637290363050393742&bg=0', 'https://www.auchan.pt/');
      ts.setCookie('AUCHANGDPRConssent=1', 'https://www.auchan.pt/');
      ts.setCookie('_gat=1', 'https://www.auchan.pt/');
      ts.setCookie('__RequestVerificationToken_L0Zyb250b2ZmaWNl0=zdYDuypwjqtaYRNI0IBofQIrELkZIOrtAeKBfm0pqd_NM9i5fvqUjmA-xQ5mAx2jqJx9OapK4VDdVrTFwH4c3A71e-vMah8Ns0gUZ3z0cfo1', 'https://www.auchan.pt/');
      ts.setCookie('AuchanSessionCookie=kRqTvS_4okJt0Qgkej_G711Kd9YiJTiZx2ufW8unGt2kU1QgqIrj95RTzeoTUMTxtZdXFGRH0yRnGu_A2UUk276axF0sHvKKybG6ZQciipdjCHu1dPdam9aU5zkwd0sEwwibSfnWUPS5koZ5_Wr0cxs8L4KLmcMS4DdkWgGR1ST60AElP61t30l5grC8NC6-vKgeYF8LKgSpLxUH3ttd4pjTttK01_mJeTURt-JL1JCeMRF7ZssZv6DAYeMj6PbYMdqvgQt15NYuyFdO95P4tarKgYsepc3DxqT2W58wu82r3UXOWfhJ2FwyC15FU7pyT_rnYhqUEdWidW9V6EtmIH11IsAKPAGIKe3hGL3JCOoND-Jz4Q80yo-4bY_tBPhMnPnEawS_LT9VJFSAPOhrVNPNn8uEbBiYSYQKHfA-v3gxEmK-50g5WPzfH0elm3c-ascKiKklkrSmFktaDg_HjA', 'https://www.auchan.pt/');
    }
    if (url.startsWith('https://www.all4golf.de/')) {
      ts.setCookie('cookiePreferences={"groups":{},"hash":"W10="}', 'https://www.all4golf.de/');
      ts.setCookie('allowCookie=1', 'https://www.all4golf.de/');
    }
    if (url.startsWith('https://www.officefurnitureonline.co.uk/')) {
      ts.setCookie('OptanonAlertBoxClosed=2020-07-01T09:52:29.376Z', 'https://www.officefurnitureonline.co.uk/');
    }
    if (url.startsWith('https://www.hot.at/')) {
      ts.setCookie('cookieconsent_status=dismiss', 'https://www.hot.at/');
    }
    if (url.startsWith('https://www.mytheresa.com/')) {
      ts.setCookie('myth_country=%7Cen-de%7CDE%7Cen', 'https://www.mytheresa.com/');
      ts.setCookie('myth_cookie_policy=1', 'https://www.mytheresa.com/');
      ts.setCookie('TC_PRIVACY=0@013@2@', 'https://www.mytheresa.com/');
      ts.setCookie('TC_PRIVACY_CENTER=2', 'https://www.mytheresa.com/');
    }
    if (url.startsWith('https://www.sky.de/')) {
      ts.setCookie('consentUUID=a865f2da-7087-442d-973b-80592b21e4ad', 'https://www.sky.de/');
      ts.setCookie('euconsent-v2=CO2OuoKO2OuoKAGABBENAtCgAAAAAAAAAAYgAAAAAAAA.YAAAAAAAAAAA', 'https://www.sky.de/');
      ts.setCookie('check=true', 'https://www.sky.de/');
      ts.setCookie('_sp_v1_consent=1!0:-1:-1:-1', 'https://www.sky.de/');
      ts.setCookie('waSky.consent.purposes={%22essential%22:true%2C%22optimierung%22:true%2C%22personal%22:false%2C%22marketing%22:false}', 'https://www.sky.de/');
    }
    if (url.startsWith('https://www.edeka.de/')) {
      ts.setCookie('hideCookiePolicyForSession=true', 'https://www.edeka.de/');
    }
    if (url.startsWith('https://www.seeberger.de/')) {
      ts.setCookie('CookieConsent={stamp:%27nzop4kdZl7Llhd0WVkBMpPBXiCYKOWMza3VyBR7q2HgeBWYy7kEFrA==%27%2Cnecessary:true%2Cpreferences:false%2Cstatistics:false%2Cmarketing:false%2Cver:1%2Cutc:1595512362926%2Cregion:%27de%27}', 'https://www.seeberger.de/');
    }
    if (url.startsWith('https://shop.seeberger.de/')) {
      ts.setCookie('eu_cookie={"6":false,"9":false,"12":false,"264":true,"522":false,"cookie_15":false,"cookie_23":true}', 'https://shop.seeberger.de/');
      ts.setCookie('cookieHint=true', 'https://shop.seeberger.de/');
    }
    if (url.startsWith('https://www.heinemann-shop.com/')) {
      ts.setCookie('cookie-notification=ACCEPTED', 'https://www.edeka.de/');
    }
    if (url.startsWith('https://www.marc-cain.com/')) {
      ts.setCookie('language=0', 'https://www.marc-cain.com/');
      //ts.setCookie('sid=t5g6a0850gr7n6tu0u12kqhp1e', 'https://www.marc-cain.com/');
      ts.setCookie('sMCCountry=a7c40f631fc920687.20179984', 'https://www.marc-cain.com/');
      ts.setCookie('displayedCookiesNotification=1', 'https://www.marc-cain.com/');
      ts.setCookie('CookieConsent={stamp:%27e4de+MP43MYEuWGhFJ3rEgfbQ2l5JjDj4TtVtQ8X3i7OcPoTfToVfA==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cver:1%2Cutc:1596206890043%2Cregion:%27de%27}', 'https://www.marc-cain.com/');
    }
    if (url.startsWith('https://www.orsay.com/')) {
      ts.setCookie('dw_app_download_closed=true', 'https://www.orsay.com/');
      ts.setCookie('dw_cookies_accepted=1', 'https://www.orsay.com/');
      ts.setCookie('dw_locale_setting=1', 'https://www.orsay.com/');
      ts.setCookie('delivery_warning_visibility=hidden', 'https://www.orsay.com/');
    }
    if (url.startsWith('https://www.lampenwelt.de/')) {
      ts.setCookie('nc_euconsent=BO4RtfCO4RtfCAfJuBENDXAAAAAAAA', 'https://www.lampenwelt.de/');
      ts.setCookie('lw-business-selectionDisplayed=1', 'https://www.lampenwelt.de/');
      ts.setCookie('newsletterDisplayed=1', 'https://www.lampenwelt.de/');
      ts.setCookie('sb-closed=true', 'https://www.lampenwelt.de/');
    }
    if (url.startsWith('https://www.engelhorn.de/')) {
      ts.setCookie('nc_euconsent=BO4VmqzO4VmqzAfGmBDEDXAAAAAfqACAP0AfoA', 'https://www.engelhorn.de/');
      ts.setCookie('__cmpcvc=__s40_s65_s23_U__', 'https://www.engelhorn.de/');
      ts.setCookie('__cmpcpc=__7__', 'https://www.engelhorn.de/');
    }
    if (url.startsWith('https://www.adidas.de/')) {
      ts.setCookie('UserSignUpAndSave=3', 'https://www.adidas.de/');
      ts.setCookie('notice_preferences=0', 'https://www.adidas.de/');
      ts.setCookie('langPreference=de', 'https://www.adidas.de/');
      ts.setCookie('s_cc=true', 'https://www.adidas.de/');
      ts.setCookie('geoRedirectionAlreadySuggested=true', 'https://www.adidas.de/');
      ts.setCookie('geo_country=DE', 'https://www.adidas.de/');
      ts.setCookie('onesite_country=DE', 'https://www.adidas.de/');
      ts.setCookie('mobileAppBanerCookie=undefined', 'https://www.adidas.de/');
    }
    if (url.startsWith('https://www.conrad.de/')) {
      ts.setCookie('vatMode=gross', 'https://www.conrad.de/');
      ts.setCookie('cookiesGloballyAccepted=no', 'https://www.conrad.de/');
      ts.setCookie('ga-disable-UA-17246844-1=true', 'https://www.conrad.de/');
      ts.setCookie('cookieNotificationClosed=yes', 'https://www.conrad.de/');
      ts.setCookie('subdomainCookieConsentSet=yes', 'https://www.conrad.de/');
      ts.setCookie('subdomainCookieNotificationClosedSet=yes', 'https://www.conrad.de/');
      ts.setCookie('cookieRejectionTimestamp=1598862957632', 'https://www.conrad.de/');
      ts.setCookie('session_tracked=true', 'https://www.conrad.de/');
      ts.setCookie('user_tracked=new', 'https://www.conrad.de/');
      ts.setCookie('_gat_UA-17246844-1=1', 'https://www.conrad.de/');
      ts.setCookie('_dc_gtm_UA-17246844-1=1', 'https://www.conrad.de/');
    }
    if (url.startsWith('https://www.madeleine.de/')) {
      ts.setCookie('uac=0', 'https://www.madeleine.de/');
    }
    if (url.startsWith('https://www.cosmote.gr/')) {
      ts.setCookie('COSMOTE_Cookies_Accepted=10000', 'https://www.cosmote.gr/');
    }
    if (url.startsWith('https://www.germanos.gr/')) {
      ts.setCookie('GERMANOS_Cookies_Accepted=10000', 'https://www.germanos.gr/');
    }
    if (url.startsWith('https://www.huk24.de/')) {
      ts.setCookie('dtCookie=0F14D0B03D1BE41EDB27691B3644BDE1|X2RlZmF1bHR8MQ', 'https://www.huk24.de/');
      ts.setCookie('consent_version=1.5', 'https://www.huk24.de/');
      ts.setCookie('consent_technical=ALLOW', 'https://www.huk24.de/');
      ts.setCookie('consent_marketing=DENY', 'https://www.huk24.de/');
      ts.setCookie('consent_functional=DENY', 'https://www.huk24.de/');
    }
    if (url.startsWith('https://www.kicker.de/')) {
      ts.setCookie('axd=4237811184606093992', 'https://www.kicker.de/');
      ts.setCookie('iom_consent=01000000000000&1600070124563', 'https://www.kicker.de/');
      ts.setCookie('ioam2018=001d11411f63475b15f5f21a2:1627113251201:1600070051201:.kicker.de:3:mobkicke:2000:noevent:1600070124276:ugwitp', 'https://www.kicker.de/');
      ts.setCookie('POPUPCHECK=1600156451202', 'https://www.kicker.de/');
      ts.setCookie('__cmpcvc=__s23_s1409_c4499_c5158_U__', 'https://www.kicker.de/');
      ts.setCookie('euconsent-v2=CO5t1BnO5t1MhAfZXBDEA3CgAAAAAAAAAAigAAALbgCAGfATIAmcBbYCgKAADAABIAAUAAGgABwAAiAAJAACoAAsAAMgADQAA6AAPAAEIABEAASgAEwABSAAVAAA', 'https://www.kicker.de/');
      ts.setCookie('__cmpcpc=__1__', 'https://www.kicker.de/');
    }
    if (url.startsWith('https://www.hofer.at/')) {
      ts.setCookie('sat_track=false', 'https://www.hofer.at/');
      ts.setCookie('omniture_optout=yes', 'https://www.hofer.at/');
      ts.setCookie('cq-opt-out=yes/1600173501905', 'https://www.hofer.at/');
    }
    if (url.startsWith('https://www.fashionid.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.fashionid.de/');
    }
    if (url.startsWith('https://www.peek-cloppenburg.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.peek-cloppenburg.de/');
    }
    if (url.startsWith('https://www.stylebop.com/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.stylebop.com/');
    }
    if (url.startsWith('https://www.ansons.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.ansons.de/');
    }
    if (url.startsWith('https://www.dm.de/')) {
      ts.setCookie('dm_tcc=partial', 'https://www.dm.de/');
      ts.setCookie('_dd_l=1', 'https://www.dm.de/');
      ts.setCookie('dm_tcc_meta=1', 'https://www.dm.de/');
      ts.setCookie('BVImplmain_site=18357', 'https://www.dm.de/');
    }
    if (url.startsWith('https://www.decathlon.pt/')) {
      ts.setCookie('TC_OPTOUT=0@@@007@@@ALL', 'https://www.decathlon.pt/');
      ts.push('block browser-update.org/update.show.min.js');
    }

    ts.blockDomains(...blockDomains)
      .setActivityTimeout(activityTimeout)
      .setTimeout(timeout)
      .navigate(url)

    return ts
  }

  /**
   * @param url             The competitor's URL to test.
   * @param appName         The name of the app to be blocked.
   * @param speedKitConfig  The Speed Kit config.
   * @param location        The location where the test is executed.
   * @param isMobile        true if the mobile site is tested, false otherwise.
   * @param activityTimeout The activity timeout.
   * @param cookie          The cookie string to be set.
   * @param timeout         The timeout.
   * @return                The created Web Page Test script.
   */
  private buildForSpeedKitTest(
    url: string,
    appName: string | null,
    speedKitConfig: string,
    location: string,
    isMobile: boolean,
    activityTimeout: number,
    cookie: string,
    timeout: number,
  ): TestScript {
    const basicAuthRegex = /\w*:\w*@/;
    if (basicAuthRegex.test(url)) {
        url = url.replace(basicAuthRegex, '')
    }

    // Edit split criterion id necessary to ensure SK is active for test run.
    const splitRegex = /.*split:.\d+\.\d*[^,]/;
    if (splitRegex.test(speedKitConfig)) {
      speedKitConfig = speedKitConfig.replace(splitRegex, 'split: 1.0')
    }

    if(url.startsWith("https://mobile.yoox.com")) {
      url = url.substr(0, url.indexOf('#'))
    }

    if (url.startsWith("https://oleo.io")) {
      activityTimeout = 5000
      speedKitConfig = `{  
   "appName":"little-dragon-72",
   "enabledSites":[  
      {  
         "pathname":[  
            "/land_2/Lackierung",
            "/preise",
            "/partners",
            "/überuns"
         ]
      }
   ],
   "whitelist":[  
      {  
         "host":[  
            "caroobi.com",
            "oleo.io",
            "fonts.googleapis.com",
            "fonts.gstatic.com",
            "static.hotjar.com",
            "script.hotjar.com",
            "vars.hotjar.com",
            "static.criteo.net",
            "d34zngbna5us75.cloudfront.net",
            "s3-eu-west-1.amazonaws.com"
         ]
      },
      {  
         "url":[  
            "www.google-analytics.com/analytics.js"
         ]
      }
   ],
   "blacklist":[  
      {  
         "pathname":[  
            "/mistri_info",
            "/mistri_funnel",
            "/foc_checkout_v4",
            "/checkout"
         ]
      }
   ]
}`;
    }

    const { host, hostname, protocol } = parse(url)

    // The URL to call to install the SW
    const installSpeedKitUrl = format({
      protocol,
      host,
      pathname: '/install-speed-kit',
      search: `config=${encodeURIComponent(speedKitConfig)}`,
    })


    // SW always needs to be installed
    const ts = testScript()

    this.addCookies(ts, cookie, url);

    if (isMobile) {
    //   ts.setViewport(480, 987); // Maximum viewport
    } else {
      ts.setViewport(1366, 768); // Good desktop viewport
    }

    ts.setActivityTimeout(activityTimeout)
      .logData(false)
      .setTimeout(timeout)
      .setDns(hostname!, credentials.makefast_ip)
      .navigate(installSpeedKitUrl)

    // FIXME when using the shield pop, h2 is not supported anymore.
    // if (!appName) {
      // ts.setDns(`${credentials.app}.app.baqend.com`, credentials.shield_pop_ip)
    // }

    // Hack to make "decathlon.de" testable.
    if (!location.includes('-docker') || url.indexOf('decathlon.de') !== -1) {
      ts.navigate('http://127.0.0.1:8888/orange.html')
    }

    // Hack to circumvent zip code protection for "shop.rewe.de"
    if (url.startsWith('https://shop.rewe.de/')) {
      // Cookies to choose a marked
      ts.setCookie('marketsCookie=%7B%22marketId%22%3A%22540622%22%2C%22zipCode%22%3A%2225337%22%2C%22serviceTypes%22%3A%5B%22PICKUP%22%5D%2C%22customerZipCode%22%3A%2225337%22%2C%22marketZipCode%22%3A%2225336%22%7D', 'https://shop.rewe.de/');
      ts.setCookie('cookie-consent=1', 'https://shop.rewe.de/');
    }

    if (url.startsWith('https://www.snipes.com')) {
      ts.setCookie('customerCountry=de', 'https://www.snipes.com/');
    }

    if (url.startsWith('https://eu.puma.com/')) {
      ts.setCookie('pumacookies=1', 'https://eu.puma.com/');
    }

    if (url.startsWith('https://www.mediamarkt.de/')) {
      ts.setCookie('MC_PRIVACY=marketing', 'https://www.mediamarkt.de/');
    }
    if (url.startsWith('https://www.t-systems.com/')) {
      ts.setCookie('CONSENTMGR=ts:1592571089406%7Cconsent:false', 'https://www.t-systems.com/');
    }
    if (url.startsWith('https://www.casinos.at/')) {
      ts.setCookie('JSESSIONID=DDC555B0A8FFE4543CA22A6F7F603C9E', 'https://www.casinos.at/');
      ts.setCookie('cookiesession1=355763B9ABVRC492QMDBNUY23M5F0ADB', 'https://www.casinos.at/');
    }
    if (url.startsWith('https://shop.casinos.at/')) {
      ts.setCookie('XTCsid=306a128cd40c0c54cdf536c15282ef03', 'https://shop.casinos.at/');
      ts.setCookie('cookiesession1=355763B9ABVRC492QMDBNUY23M5F0ADB', 'https://shop.casinos.at/');
    }
    if (url.startsWith('https://www.continente.pt/')) {
      ts.setCookie('smartbanner-closed=true', 'https://www.continente.pt/');
    }
    if (url.startsWith('https://www.birkenstock.com/')) {
      ts.setCookie('privacy_settings=gtm_googleanalytics|platformpersonalization|youtube|shoesizeme|vimeo|__olapicU|gender|gtm_bing|gtm_sfmc-predictive|gtm_affilinet|gtm_ga-advertising|gtm_adwords|gtm_facebook|dynamicyield', 'https://www.birkenstock.com/');
      ts.setCookie('privacy_level=off|off', 'https://www.birkenstock.com/');
    }
    if (url.startsWith('https://de.tommy.com/')) {
      ts.setCookie('PVH_COOKIES_GDPR=Accept', 'https://de.tommy.com/');
      ts.setCookie('PVH_COOKIES_GDPR_SOCIALMEDIA=Reject', 'https://de.tommy.com/');
      ts.setCookie('PVH_COOKIES_GDPR_ANALYTICS=Reject', 'https://de.tommy.com/');
    }
    if (url.startsWith('https://www.ernstings-family.de/')) {
      ts.setCookie('TC_PRIVACY_CENTER=ALL', 'https://www.ernstings-family.de/');
      ts.setCookie('TC_PRIVACY=1@009@ALL@@1593418821237@', 'https://www.ernstings-family.de/');
    }
    if (url.startsWith('https://de.iqos.com/')) {
      ts.setCookie('dw_Advertisement_cookie=opt-out', 'https://de.iqos.com/');
      ts.setCookie('time_cookies_accepted=1593419068409', 'https://de.iqos.com/');
      ts.setCookie('cookies_accepted=1', 'https://de.iqos.com/');
      ts.setCookie('dw_Technical_cookie=opt-out', 'https://de.iqos.com/');
      ts.setCookie('iqos-skip-home-animations=yes', 'https://de.iqos.com/');
      ts.setCookie('iqos-age-verified=yes', 'https://de.iqos.com/');
    }
    if (url.startsWith('https://www.gelsenwasser.de/')) {
      ts.setCookie('cookie_optin=essential:1|c0001:0|c0002:0', 'https://www.gelsenwasser.de/');
    }
    if (url.startsWith('https://www.ibm.com/')) {
      ts.setCookie('cmapi_cookie_privacy=permit_1_required', 'https://www.ibm.com/');
      ts.setCookie('notice_preferences=0:', 'https://www.ibm.com/');
      ts.setCookie('notice_gdpr_prefs=0:', 'https://www.ibm.com/');
      ts.setCookie('notice_behavior=expressed|eu', 'https://www.ibm.com/');
      ts.setCookie('cm-proactive-state={%22type%22:%22proactiveInvite%22%2C%22state%22:-1}', 'https://www.ibm.com/');
    }
    if (url.startsWith('https://www.barclaycard.de/')) {
      ts.setCookie('bcConsent={"Statistik":false,"Personalisierung":false,"exp":"2020-8-28"}', 'https://www.barclaycard.de/');
    }

    if (url.startsWith('https://mobil.krone.at/')) {
      ts.setCookie('krn_consent_shown=1', 'https://mobil.krone.at/');
      ts.setCookie('krn_cons_ads=1', 'https://mobil.krone.at/');
      ts.setCookie('_gat_fxfTracker=1', 'https://mobil.krone.at/');
      ts.setCookie('krn_cons_content=1', 'https://mobil.krone.at/');
      ts.setCookie('POPUPCHECK=1593507473928', 'https://mobil.krone.at/');
    }
    if (url.startsWith('https://www.krone.at/')) {
      ts.setCookie('krn_consent_shown=1', 'https://www.krone.at/');
      ts.setCookie('krn_cons_ads=1', 'https://www.krone.at/');
      ts.setCookie('_gat_fxfTracker=1', 'https://www.krone.at/');
      ts.setCookie('krn_cons_content=1', 'https://www.krone.at/');
      ts.setCookie('POPUPCHECK=1593507473928', 'https://www.krone.at/');
    }
    if (url.startsWith('https://www.auchan.pt/')) {
      ts.setCookie('AUCHANCOOKIE=id=e7e4652f-3a17-4503-9385-f06330d0f8af&an=1&pl=0&nl=False&se=637290393050549806&b=28edeffc-553e-42b7-b892-58830141473e&ProductsInBasket=&LastBasketUpdate=637290363050393742&bg=0', 'https://www.auchan.pt/');
      ts.setCookie('AUCHANGDPRConssent=1', 'https://www.auchan.pt/');
      ts.setCookie('_gat=1', 'https://www.auchan.pt/');
      ts.setCookie('__RequestVerificationToken_L0Zyb250b2ZmaWNl0=zdYDuypwjqtaYRNI0IBofQIrELkZIOrtAeKBfm0pqd_NM9i5fvqUjmA-xQ5mAx2jqJx9OapK4VDdVrTFwH4c3A71e-vMah8Ns0gUZ3z0cfo1', 'https://www.auchan.pt/');
      ts.setCookie('AuchanSessionCookie=kRqTvS_4okJt0Qgkej_G711Kd9YiJTiZx2ufW8unGt2kU1QgqIrj95RTzeoTUMTxtZdXFGRH0yRnGu_A2UUk276axF0sHvKKybG6ZQciipdjCHu1dPdam9aU5zkwd0sEwwibSfnWUPS5koZ5_Wr0cxs8L4KLmcMS4DdkWgGR1ST60AElP61t30l5grC8NC6-vKgeYF8LKgSpLxUH3ttd4pjTttK01_mJeTURt-JL1JCeMRF7ZssZv6DAYeMj6PbYMdqvgQt15NYuyFdO95P4tarKgYsepc3DxqT2W58wu82r3UXOWfhJ2FwyC15FU7pyT_rnYhqUEdWidW9V6EtmIH11IsAKPAGIKe3hGL3JCOoND-Jz4Q80yo-4bY_tBPhMnPnEawS_LT9VJFSAPOhrVNPNn8uEbBiYSYQKHfA-v3gxEmK-50g5WPzfH0elm3c-ascKiKklkrSmFktaDg_HjA', 'https://www.auchan.pt/');
    }
    if (url.startsWith('https://www.all4golf.de/')) {
      ts.setCookie('cookiePreferences={"groups":{},"hash":"W10="}', 'https://www.all4golf.de/');
      ts.setCookie('allowCookie=1', 'https://www.all4golf.de/');
    }
    if (url.startsWith('https://www.officefurnitureonline.co.uk/')) {
      ts.setCookie('OptanonAlertBoxClosed=2020-07-01T09:52:29.376Z', 'https://www.officefurnitureonline.co.uk/');
    }
    if (url.startsWith('https://www.hot.at/')) {
      ts.setCookie('cookieconsent_status=dismiss', 'https://www.hot.at/');
    }
    if (url.startsWith('https://www.mytheresa.com/')) {
      ts.setCookie('myth_country=%7Cen-de%7CDE%7Cen', 'https://www.mytheresa.com/');
      ts.setCookie('myth_cookie_policy=1', 'https://www.mytheresa.com/');
      ts.setCookie('TC_PRIVACY=0@013@2@', 'https://www.mytheresa.com/');
      ts.setCookie('TC_PRIVACY_CENTER=2', 'https://www.mytheresa.com/');
    }
    if (url.startsWith('https://www.sky.de/')) {
      ts.setCookie('consentUUID=a865f2da-7087-442d-973b-80592b21e4ad', 'https://www.sky.de/');
      ts.setCookie('euconsent-v2=CO2OuoKO2OuoKAGABBENAtCgAAAAAAAAAAYgAAAAAAAA.YAAAAAAAAAAA', 'https://www.sky.de/');
      ts.setCookie('check=true', 'https://www.sky.de/');
      ts.setCookie('_sp_v1_consent=1!0:-1:-1:-1', 'https://www.sky.de/');
      ts.setCookie('waSky.consent.purposes={%22essential%22:true%2C%22optimierung%22:true%2C%22personal%22:false%2C%22marketing%22:false}', 'https://www.sky.de/');
    }
    if (url.startsWith('https://www.edeka.de/')) {
      ts.setCookie('hideCookiePolicyForSession=true', 'https://www.edeka.de/');
    }
    if (url.startsWith('https://www.seeberger.de/')) {
      ts.setCookie('CookieConsent={stamp:%27nzop4kdZl7Llhd0WVkBMpPBXiCYKOWMza3VyBR7q2HgeBWYy7kEFrA==%27%2Cnecessary:true%2Cpreferences:false%2Cstatistics:false%2Cmarketing:false%2Cver:1%2Cutc:1595512362926%2Cregion:%27de%27}', 'https://www.seeberger.de/');
    }
    if (url.startsWith('https://shop.seeberger.de/')) {
      ts.setCookie('eu_cookie={"6":false,"9":false,"12":false,"264":true,"522":false,"cookie_15":false,"cookie_23":true}', 'https://shop.seeberger.de/');
      ts.setCookie('cookieHint=true', 'https://shop.seeberger.de/');
    }
    if (url.startsWith('https://www.heinemann-shop.com/')) {
      ts.setCookie('cookie-notification=ACCEPTED', 'https://www.edeka.de/');
    }

    if (url.startsWith('https://www.marc-cain.com/')) {
      ts.setCookie('language=0', 'https://www.marc-cain.com/');
      //ts.setCookie('sid=t5g6a0850gr7n6tu0u12kqhp1e', 'https://www.marc-cain.com/');
      ts.setCookie('sMCCountry=a7c40f631fc920687.20179984', 'https://www.marc-cain.com/');
      ts.setCookie('displayedCookiesNotification=1', 'https://www.marc-cain.com/');
      ts.setCookie('CookieConsent={stamp:%27e4de+MP43MYEuWGhFJ3rEgfbQ2l5JjDj4TtVtQ8X3i7OcPoTfToVfA==%27%2Cnecessary:true%2Cpreferences:true%2Cstatistics:true%2Cmarketing:true%2Cver:1%2Cutc:1596206890043%2Cregion:%27de%27}', 'https://www.marc-cain.com/');
    }
    if (url.startsWith('https://www.orsay.com/')) {
      ts.setCookie('dw_app_download_closed=true', 'https://www.orsay.com/');
      ts.setCookie('dw_cookies_accepted=1', 'https://www.orsay.com/');
      ts.setCookie('dw_locale_setting=1', 'https://www.orsay.com/');
      ts.setCookie('delivery_warning_visibility=hidden', 'https://www.orsay.com/');
    }
    if (url.startsWith('https://www.lampenwelt.de/')) {
      ts.setCookie('nc_euconsent=BO4RtfCO4RtfCAfJuBENDXAAAAAAAA', 'https://www.lampenwelt.de/');
      ts.setCookie('lw-business-selectionDisplayed=1', 'https://www.lampenwelt.de/');
      ts.setCookie('newsletterDisplayed=1', 'https://www.lampenwelt.de/');
      ts.setCookie('sb-closed=true', 'https://www.lampenwelt.de/');
    }
    if (url.startsWith('https://www.engelhorn.de/')) {
      ts.setCookie('nc_euconsent=BO4VmqzO4VmqzAfGmBDEDXAAAAAfqACAP0AfoA', 'https://www.engelhorn.de/');
      ts.setCookie('__cmpcvc=__s40_s65_s23_U__', 'https://www.engelhorn.de/');
      ts.setCookie('__cmpcpc=__7__', 'https://www.engelhorn.de/');
    }
    if (url.startsWith('https://www.adidas.de/')) {
      ts.setCookie('UserSignUpAndSave=3', 'https://www.adidas.de/');
      ts.setCookie('notice_preferences=0', 'https://www.adidas.de/');
      ts.setCookie('langPreference=de', 'https://www.adidas.de/');
      ts.setCookie('s_cc=true', 'https://www.adidas.de/');
      ts.setCookie('geoRedirectionAlreadySuggested=true', 'https://www.adidas.de/');
      ts.setCookie('geo_country=DE', 'https://www.adidas.de/');
      ts.setCookie('onesite_country=DE', 'https://www.adidas.de/');
      ts.setCookie('mobileAppBanerCookie=undefined', 'https://www.adidas.de/');
    }
    if (url.startsWith('https://www.conrad.de/')) {
      ts.setCookie('vatMode=gross', 'https://www.conrad.de/');
      ts.setCookie('cookiesGloballyAccepted=no', 'https://www.conrad.de/');
      ts.setCookie('ga-disable-UA-17246844-1=true', 'https://www.conrad.de/');
      ts.setCookie('cookieNotificationClosed=yes', 'https://www.conrad.de/');
      ts.setCookie('subdomainCookieConsentSet=yes', 'https://www.conrad.de/');
      ts.setCookie('subdomainCookieNotificationClosedSet=yes', 'https://www.conrad.de/');
      ts.setCookie('cookieRejectionTimestamp=1598862957632', 'https://www.conrad.de/');
      ts.setCookie('session_tracked=true', 'https://www.conrad.de/');
      ts.setCookie('user_tracked=new', 'https://www.conrad.de/');
      ts.setCookie('_gat_UA-17246844-1=1', 'https://www.conrad.de/');
      ts.setCookie('_dc_gtm_UA-17246844-1=1', 'https://www.conrad.de/');
    }
    if (url.startsWith('https://www.madeleine.de/')) {
      ts.setCookie('uac=0', 'https://www.madeleine.de/');
    }
    if (url.startsWith('https://www.cosmote.gr/')) {
      ts.setCookie('COSMOTE_Cookies_Accepted=10000', 'https://www.cosmote.gr/');
    }
    if (url.startsWith('https://www.germanos.gr/')) {
      ts.setCookie('GERMANOS_Cookies_Accepted=10000', 'https://www.germanos.gr/');
    }
    if (url.startsWith('https://www.huk24.de/')) {
      ts.setCookie('dtCookie=0F14D0B03D1BE41EDB27691B3644BDE1|X2RlZmF1bHR8MQ', 'https://www.huk24.de/');
      ts.setCookie('consent_version=1.5', 'https://www.huk24.de/');
      ts.setCookie('consent_technical=ALLOW', 'https://www.huk24.de/');
      ts.setCookie('consent_marketing=DENY', 'https://www.huk24.de/');
      ts.setCookie('consent_functional=DENY', 'https://www.huk24.de/');
    }
    if (url.startsWith('https://www.kicker.de/')) {
      ts.setCookie('axd=4237811184606093992', 'https://www.kicker.de/');
      ts.setCookie('iom_consent=01000000000000&1600070124563', 'https://www.kicker.de/');
      ts.setCookie('ioam2018=001d11411f63475b15f5f21a2:1627113251201:1600070051201:.kicker.de:3:mobkicke:2000:noevent:1600070124276:ugwitp', 'https://www.kicker.de/');
      ts.setCookie('POPUPCHECK=1600156451202', 'https://www.kicker.de/');
      ts.setCookie('__cmpcvc=__s23_s1409_c4499_c5158_U__', 'https://www.kicker.de/');
      ts.setCookie('euconsent-v2=CO5t1BnO5t1MhAfZXBDEA3CgAAAAAAAAAAigAAALbgCAGfATIAmcBbYCgKAADAABIAAUAAGgABwAAiAAJAACoAAsAAMgADQAA6AAPAAEIABEAASgAEwABSAAVAAA', 'https://www.kicker.de/');
      ts.setCookie('__cmpcpc=__1__', 'https://www.kicker.de/');
    }
    if (url.startsWith('https://www.hofer.at/')) {
      ts.setCookie('sat_track=false', 'https://www.hofer.at/');
      ts.setCookie('omniture_optout=yes', 'https://www.hofer.at/');
      ts.setCookie('cq-opt-out=yes/1600173501905', 'https://www.hofer.at/');
    }
    if (url.startsWith('https://www.fashionid.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.fashionid.de/');
    }
    if (url.startsWith('https://www.peek-cloppenburg.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.peek-cloppenburg.de/');
    }
    if (url.startsWith('https://www.stylebop.com/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.stylebop.com/');
    }
    if (url.startsWith('https://www.ansons.de/')) {
      ts.setCookie('cookiesConsent=0|0|0', 'https://www.ansons.de/');
    }
    if (url.startsWith('https://www.dm.de/')) {
      ts.setCookie('dm_tcc=partial', 'https://www.dm.de/');
      ts.setCookie('_dd_l=1', 'https://www.dm.de/');
      ts.setCookie('dm_tcc_meta=1', 'https://www.dm.de/');
      ts.setCookie('BVImplmain_site=18357', 'https://www.dm.de/');
    }
    if (url.startsWith('https://www.decathlon.pt/')) {
      ts.setCookie('TC_OPTOUT=0@@@007@@@ALL', 'https://www.decathlon.pt/');
      ts.push('block browser-update.org/update.show.min.js');
    }

    return ts
      .logData(true)
      .navigate(url)
  }

  /**
   * Adds cookies to the given test script.
   *
   * @param ts        The test script to add the cookies to.
   * @param cookie    A string of cookies to be added to the test script
   * @param url       The url under test
   */
  private addCookies(ts: TestScript, cookie: string, url: string): void {
    const origin = new URL(url).origin;
    const cookieList = cookie.split(';');
    cookieList.forEach(cookie => ts.setCookie(cookie, origin));
  }

  /**
   * Creates a Web Page Test script to execute.
   *
   * @param url                   The URL to create the test script for.
   * @param isTestWithSpeedKit    Whether to test with Speed Kit enabled.
   * @param speedKitConfig        The serialized speedkit config string.
   * @param location              The location where the test is executed.
   * @param isMobile              true if the mobile site is tested, false otherwise.
   * @param activityTimeout       The activity timeout.
   * @param appName               The name of the baqend app.
   * @param cookie                The cookie string to be set.
   * @param timeout               The timeout.
   * @return                      The created Web Page Test script.
   */
  createTestScript(
    url: string,
    isTestWithSpeedKit: boolean,
    speedKitConfig: string,
    location: string,
    isMobile: boolean = false,
    activityTimeout = DEFAULT_ACTIVITY_TIMEOUT,
    appName: string | null = null,
    cookie: string = '',
    timeout = DEFAULT_TIMEOUT,
  ): string {
    // Resolve Speed Kit config
    if (isTestWithSpeedKit) {
      return this.buildForSpeedKitTest(
        url,
        appName,
        speedKitConfig,
        location,
        isMobile,
        activityTimeout,
        cookie,
        timeout
      ).toString()
    }

    return this.buildForCompetitorTest(url, appName, location, isMobile, activityTimeout, cookie, timeout).toString()
  }
}
