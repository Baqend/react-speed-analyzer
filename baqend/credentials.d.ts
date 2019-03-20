interface Credentials {
  wpt_dns: string
  wpt_api_key: string
  makefast_ip: string
  shield_pop_ip: string
  puppeteer_host: string
  app: string
  google_api_key: string
  delete_cronjob_user: string
  delete_cronjob_password: string
  bigQueryCredentials: any
}

declare const credentials: Credentials

export default credentials
