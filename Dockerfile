FROM node:14

WORKDIR /usr/users

COPY . .

ENV PORT=80

EXPOSE 80

CMD ["npm", "start"]

