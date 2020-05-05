
#ローカル用wsサーバ　appディレクトリをマウント
#node.js npm react関係

FROM node:10.13-alpine

WORKDIR /

WORKDIR /app

EXPOSE 8080
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003

RUN npm install -g npm
RUN npm install --save ws
RUN npm install
CMD npm run start