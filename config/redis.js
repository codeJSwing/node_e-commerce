import redis from "redis"
import dotenv from "dotenv"

dotenv.config()

const redisClient = await redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_IP,
        port: process.env.REDIS_PORT
    }
})
redisClient.on('connect', () => {
    console.info('Redis connected!')
})
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})

const redisCli = redisClient.connect().then()
export default redisCli