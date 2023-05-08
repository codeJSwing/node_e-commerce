import * as redis from 'redis'
import dotenv from 'dotenv'

dotenv.config()

const redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_IP,
        port: process.env.REDIS_PORT
    },
    return_buffers: true,
    debug_mode: true
})
redisClient.on('connect', () => {
    console.info('Redis connected!')
})
redisClient.on('error', (err) => {
    console.error('Redis Client Error', err)
})

export default redisClient