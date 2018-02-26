#!/usr/bin/env bash

DIRECTORY=$(dirname $0)

docker build --tag "docker.baqend.com/makefast/makefast-proxy:latest" ${DIRECTORY}
docker push "docker.baqend.com/makefast/makefast-proxy:latest"
