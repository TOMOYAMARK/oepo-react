#websocketサーバ GCEに射出する
#node.js ws express

FROM node:10.16-alpine

WORKDIR /

EXPOSE 8080
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003

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

RUN apk update && apk add git
#一度deployブランチのgitリポジトリ全体を未公開領域(.git)にクローン→workingdirの設定
RUN git clone -b deploy https://1ecc935108d0e3ceeabd3d3d1fb23360fc36d2d2:x-oauth-basic@github.com/TOMOYAMARK/oepo-react.git /.git
WORKDIR /.git
RUN git config core.sparsecheckout true && touch .git/info/sparsecheckout && echo /server > .git/info/sparsecheckout
RUN git read-tree -m -u HEAD
RUN mkdir /app
RUN cp -r server/* /app
ADD startup.sh /
RUN chmod 744 /startup.sh

WORKDIR /app

RUN npm install -g npm && \
    npm install --save ws && \
    npm install


CMD ["/startup.sh"]