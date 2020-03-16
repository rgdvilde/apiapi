[![Build Status](https://travis-ci.com/lab9k/apiapi.svg?branch=develop)](https://travis-ci.com/lab9k/apiapi)

# apiapi

>This is a fork of the digipolis apiapi repo to try some changes for my thesis. (and also the first test commit)

> This is some sort of an api manager, which dynamically combines data from different api's. now the api expects to 
> return data in a set structure, the goal of this project is to structure the returned data dynamically 
> (more "configurable") as well.
>

## Dependencies

* [Redis](https://redis.io/topics/quickstart)
* [MongoDB](https://docs.mongodb.com/guides/server/install/)

## Build Setup

``` bash
# install dependencies
$ npm run install

# start Redis

# start MongoDB

# serve with hot reload at localhost:3000
$ npm run dev

# build for production and launch server
$ npm run build
$ npm run start

# generate static project
$ npm run generate
```

For detailed explanation on how things work, check out [Nuxt.js docs](https://nuxtjs.org).
