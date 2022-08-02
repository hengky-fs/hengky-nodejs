FROM node:14

WORKDIR /usr/users

COPY src src/

COPY package.json .

RUN npm i --quiet

EXPOSE 80

CMD ["npm", "start"]

