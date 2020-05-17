#!/bin/sh
cd /.git
git pull origin deploy
\cp -rf /.git/server/* /app
cd /app
echo starting node...
node app.js