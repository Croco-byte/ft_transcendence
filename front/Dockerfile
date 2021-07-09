FROM node:12.13-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i fsevents@latest -f --save-optional
RUN npm install --only=development

COPY . .

RUN npm run build