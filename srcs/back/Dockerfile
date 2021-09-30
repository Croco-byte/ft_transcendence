FROM node:14-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
COPY . .

# RUN npm i fsevents@latest -f --save-optional
RUN npm run build