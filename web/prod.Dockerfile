FROM node:25

WORKDIR /app/web

COPY package*.json ./

RUN npm install

COPY . .

ENV PORT=8000

EXPOSE 8000

CMD ["npm", "run", "start"]
