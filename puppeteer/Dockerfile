FROM node:9.11-slim

ENV NPM_CONFIG_LOGLEVEL info

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# It's a good idea to use dumb-init to help prevent zombie chrome processes.
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.0/dumb-init_1.2.0_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Install source code to working directory
WORKDIR "/srv/www/puppeteer/"
COPY . "/srv/www/puppeteer/"

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && mkdir -p /srv/www/puppeteer/node_modules \
    && mkdir -p /var/chrome \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /srv/www/puppeteer \
    && chown -R pptruser:pptruser /var/chrome

# Run everything after as non-privileged user.
USER pptruser

# Install dependencies
RUN npm install \
    && npm run build

# Node only exposes port 8080
EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "/srv/www/puppeteer/index.js", "--port=8080", "--caching", "--user-data-dir=/var/chrome"]
