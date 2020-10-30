FROM node:lts

LABEL maintainer="sublimer@sublimer.me"

WORKDIR /root
COPY package.json .
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3001
ENV PUSHBULLET_ACCESS_TOKEN=""
ENV PUSHBULLET_DIST_DEVICE_NAME=""
CMD [ "npm","start" ]
