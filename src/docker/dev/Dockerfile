
FROM node:10

#Create app directory
WORKDIR /usr/src/app
VOLUME /usr/src/app

RUN npm install

EXPOSE 8080

CMD ["npx", "nodemon", "./src/bin/www"]