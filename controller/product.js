import productModel from "../model/product.js";
import replyModel from "../model/reply.js";
import dotenv from "dotenv";
dotenv.config()

import redis from "redis";

const redisClient = await redis.createClient({
    legacyMode: true,
    url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
})
await redisClient.on("connect", () => {
    console.log("redis connected")
})
await redisClient.on("error", (err) => {
    console.error("redis error", err)
})
await redisClient.connect().then()
const redisCli = redisClient.v4

const getAllProducts = async (req, res) => {
    try {
        const productsFromMongo = await productModel.find()
        const redisProducts = await redisCli.get("products")
        // redisCli.del("products") // 삭제하는 명령어
        if (redisProducts !== null) {
            console.log("redis")
            return res.json({
                products: JSON.parse(redisProducts)
            })
        }
        console.log("mongo")
        await redisCli.set("products", JSON.stringify(productsFromMongo))
        return res.json({
            products: productsFromMongo
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const getProduct = async (req, res) => {
    const {id} = req.params
    try{
        const products = await productModel.find()
        const product = await productModel.findById(id)
        const replys = await replyModel.find({product: id})
        const redisProducts = await redisCli.get("products")
        const parsedRedis = JSON.parse(redisProducts)
        if (redisProducts !== null) {
            const redisProduct = await parsedRedis.filter(item => item._id === id)
            console.log("redis")
            return res.json({
                msg: `successful get data`,
                product: redisProduct,
                replys: replys.map(reply => {
                    return {
                        user: reply.user,
                        memo: reply.memo,
                        updateTime: reply.updatedAt,
                        id: reply._id
                    }
                })
            })
        }
        if(!product){
            return res.status(404).json({
                msg: "There is no product to get"
            })
        }
        console.log("mongo")
        await redisCli.set("products", JSON.stringify(products))
        res.json({
            msg: `successful get data`,
            product,
            replys: replys.map(reply => {
                return {
                    user: reply.user,
                    memo: reply.memo,
                    updateTime: reply.updatedAt,
                    id: reply._id
                }
            })
        })
    } catch(err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const newProduct = new productModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()
        res.json({
            msg: `successfully created new product`,
            product: createdProduct
        })
    } catch(err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const updateOps = {};
        for (const ops of req.body){
            updateOps[ops.propName] = ops.value;
        }
        const product = await productModel.findByIdAndUpdate(id, {$set: updateOps})
        if (!product) {
            return res.status(404).json({
                msg: `There is no product to update`
            })
        }
        res.json({
            msg: `successfully updated product by ${id}`,
            product
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const deleteAllProducts = async (req, res) => {
    try {
        const products = await productModel.deleteMany()
        res.json({
            msg: `successfully deleted all data`,
            products
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const deleteProduct = async (req, res) =>{
    const {id} = req.params
    try {
        const product = await productModel.findByIdAndDelete(id)
        if (!product) {
            return res.status(404).json({
                msg: `There is no product to delete`
            })
        }
        res.json({
            msg: `successfully deleted data by ${id}`,
            product
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const replyProduct = async (req, res) => {
    const {memo} = req.body
    const {productId} = req.params
    try {
        const newReply = new replyModel({
            product: productId,
            user: req.user._id,
            memo
        })
        const result = await newReply.save()
        res.json({
            msg: `successfully created new reply`,
            result
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

export {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct,
    replyProduct
}