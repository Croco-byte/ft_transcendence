FROM node:14-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i fsevents@latest -f --save-optional
RUN npm install
RUN npm install @vue/cli -g  -f --save-optional

COPY . .

#RUN npm run build
