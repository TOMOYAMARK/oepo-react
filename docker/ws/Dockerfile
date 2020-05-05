#websocketサーバ GCEに射出する
#node.js ws express

FROM node:10.13-alpine

WORKDIR /

EXPOSE 8080
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002
EXPOSE 3003

RUN apk update && apk add git
#一度deployブランチのgitリポジトリ全体を未公開領域(.git)にクローン→workingdirの設定
RUN git clone -b deploy https://8ac016bd8dbabf65e0046e0f5f688b838ee1c509:x-oauth-basic@github.com/Eiganken/oepori.git /.git
WORKDIR /.git
RUN git config core.sparsecheckout true && touch .git/info/sparsecheckout && echo /docker/app > .git/info/sparsecheckout
RUN git read-tree -m -u HEAD
RUN cp -r docker/app /app
ADD startup.sh /
RUN chmod 744 /startup.sh

WORKDIR /app

RUN npm install -g npm && \
    npm install --save ws


CMD ["/startup.sh"]