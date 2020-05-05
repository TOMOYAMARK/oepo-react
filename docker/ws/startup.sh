#!/bin/sh
cd /.git
git pull origin deploy
\cp -rf /.git/app /
cd /app
echo starting node...
node app.js