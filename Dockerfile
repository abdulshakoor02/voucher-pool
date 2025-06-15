
FROM node:22-alpine

ENV SUPPORTING_FILES /app
ARG DEV

# install bash for wait-for-it script
RUN apk update && apk add --update alpine-sdk build-base bash python3 nano postgresql-client

RUN mkdir -p $SUPPORTING_FILES

WORKDIR $SUPPORTING_FILES

COPY package.json package.json  

RUN npm install  

COPY . $SUPPORTING_FILES
