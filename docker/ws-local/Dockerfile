
#ローカル用wsサーバ　appディレクトリをマウント
#node.js npm react関係

FROM node:10.13-alpine

#SQLiteをインストール
WORKDIR /
RUN apk add --update \
      alpine-sdk  \
      tcl && \
    wget \
      -O sqlite.tar.gz \
      https://www.sqlite.org/src/tarball/sqlite.tar.gz?r=release && \
    tar xvfz sqlite.tar.gz && \
    ./sqlite/configure --prefix=/usr && \
    make && \
    make install && \
    sqlite3 --version

#npmパッケージインストール
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