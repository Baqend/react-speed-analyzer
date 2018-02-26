// eslint-disable-next-line import/no-extraneous-dependencies
const shell = require('shelljs');

shell.exec('docker build . -t docker.baqend.com/makefast/makefast-proxy:latest');
shell.exec('docker push docker.baqend.com/makefast/makefast-proxy:latest');

