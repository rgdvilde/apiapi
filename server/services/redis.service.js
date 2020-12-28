const redis = require('redis')
const bluebird = require('bluebird')

bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

class RedisClient {
  constructor () {
    try {
      let redisOptions = {
        port: process.env.REDIS_PORT || 6379,
        host: process.env.REDIS_HOST || '127.0.0.1'
      }
      if (process.env.REDIS_PASSWORD) {
        redisOptions.password = process.env.REDIS_PASSWORD
      }
      if (process.env.REDIS_DB) {
        redisOptions.db = process.env.REDIS_DB
      }
      if (process.env.REDIS_URL) {
        redisOptions = {
          url: process.env.REDIS_URL
        }
      }
      this.client = redis.createClient(redisOptions)
    } catch (e) {
      this.client = null
      console.error(e)
    }
    this.expirationTime = 60 * 60 // 1 hour
  }

  // const { promisify } = require('util');
  // const ttl = promisify(client.ttl).bind(client);
  // client.set('key', 'value!', 'EX', 10);
  // const remaingTime = await ttl('key');

  setData (name, data, exp) {
    if (!this.client) { return Promise.resolve(null) }
    return this.client.setAsync(name, data, 'EX', exp || this.expirationTime)
  }

  getData (name) {
    if (!this.client) { return Promise.resolve(null) }
    return this.client.getAsync(name)
  }

  async getTTL (name) {
    if (!this.client) { return Promise.resolve(null) }
    const ttl = bluebird.promisify(this.client.ttl).bind(this.client)
    const remaingTime = await ttl(name)
    return remaingTime
  }

  flushDb () {
    if (!this.client) { return Promise.reject(new Error('Client is not initialized')) }
    return this.client.flushallAsync()
  }
}

module.exports = new RedisClient()
