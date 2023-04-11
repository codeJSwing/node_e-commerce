import redis from "redis"
import dotenv from "dotenv"

dotenv.config()

const redisClient = await redis.createClient({
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    legacyMode: true
})
await redisClient.on('connect', () => {
    console.info('Redis connected!')
})
await redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})
await redisClient.connect().then()
const redisCli = redisClient.v4

export default redisCli