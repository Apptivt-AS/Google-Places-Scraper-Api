FROM node:14

WORKDIR /Apptivt-Scraper-Api

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD [ "node", "index.js" ]
