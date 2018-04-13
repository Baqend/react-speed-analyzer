#!/usr/bin/env bash
DOMAIN=$1
TMPDIR="/tmp/makefast-profile"
IP="127.0.0.1"

echo "Starting chrome on: $DOMAIN"

rm -rf $TMPDIR

chromium "--user-data-dir=$TMPDIR" --ignore-certificate-errors --unsafely-treat-insecure-origin-as-secure="http://$DOMAIN" --disable-web-security --host-rules="MAP $DOMAIN $IP" --no-first-run --disable-infobars

rm -rf $TMPDIR
