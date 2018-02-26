FROM node:8.9

# extract package
ADD . /opt/makefast-proxy

WORKDIR /opt/makefast-proxy/

RUN npm install --production

EXPOSE 80
EXPOSE 443

# change entrypoint also in bbq node deployment
ENTRYPOINT ["node", "server.js"]
