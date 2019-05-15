
FROM node:10

#Create app directory
WORKDIR /usr/src/app
VOLUME /usr/src/app

RUN npm install

EXPOSE 8080
EXPOSE 9229

ENV NODE_ENV test
CMD ["npx", "nodemon", "--inspect=0.0.0.0:9229", "./index"]