import redis from "redis"

const connectRedis = async () => {
    try {
        const redisClient = await redis.createClient({
            legacyMode: true,
            url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
        })
        await redisClient.on('connect', () => {
            console.log('redis connected')
        })
        await redisClient.on('error', (err) => {
            console.error('redis error', err)
        })
        await redisClient.connect()
    } catch (e) {
        console.log(e)
    }
}

export default connectRedis