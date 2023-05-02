import redis from "redis"
import dotenv from "dotenv"

dotenv.config()

const redisClient = await redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_IP,
        port: process.env.REDIS_PORT
    },
    legacyMode: true
})
redisClient.on('connect', () => {
    console.info('Redis connected!')
})
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})
await redisClient.connect().then()
const redisCli = redisClient.v4

export default redisCli