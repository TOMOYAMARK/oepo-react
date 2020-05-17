
#ローカル用wsサーバ　appディレクトリをマウント
#node.js npm react関係

FROM node:10.16-alpine

# #SQLiteをインストール
# WORKDIR /
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

RUN apk add --no-cache \
        sudo \
        curl \
        build-base \
        g++ \
        libpng \
        libpng-dev \
        jpeg-dev \
        pango-dev \
        cairo-dev \
        giflib-dev \
        python

#  add glibc and install canvas
RUN apk --no-cache add ca-certificates wget  && \
    wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://alpine-pkgs.sgerrand.com/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.29-r0/glibc-2.29-r0.apk && \
    apk add glibc-2.29-r0.apk && \
    npm install canvas@2.5.0

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