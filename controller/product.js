import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisClient from "../config/redis.js";
import lodash from "lodash";

/*
* todo
*  1. 병렬 처리 (promise all) - O
*  2. 예외 처리 (if -> switch - O)
*   데이터 자체가 없는 경우 - O
*   redis 데이터가 있고, db 데이터와 같을 때 - O
*   DB 에서 가져온 데이터와 Redis 데이터가 일치하지 않는 경우 - O
*   redis 데이터가 없지만, db 데이터가 있는 경우 - O
*/
const getAllProducts = async (req, res) => {
    try {
        const result = await redisClient.scan('0')

        const productPromises = []

        for (const product of result.keys) {
            productPromises.push(getProduct(req, res, product))
        }

        const products = await Promise.all(productPromises)

        console.log(products)

        res.json({
            message: `Successfully retrieved all products`
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

/*
* todo
*   후기를 일단은 따로 두자.
* */
const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const productPromise = Promise.all([
            ProductModel.findById(id),
            redisClient.get(id)
        ])
        const [product, productFromRedis] = await productPromise

        if (!product) {
            return res.status(404).json({
                message: `There is no product to get`
            })
        }

        if (lodash.isEmpty(productFromRedis)) {
            await redisClient.set(id, JSON.stringify(product))
        }

        res.json({
            message: `successfully get product and Reply by ${id}`,
            product
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const newProduct = new ProductModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()

        await redisClient.set(`${createdProduct._id}`, JSON.stringify(createdProduct))
        await redisClient.expire(`${createdProduct._id}`, 3600)

        res.json({
            message: `successfully created new product`,
            product: createdProduct
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const product = await ProductModel.findById(id)
        if (!product) {
            return res.status(404).json({
                message: `There is no product to update`
            })
        }

        const updateOps = req.body
        await ProductModel.updateOne({_id: id}, {$set: updateOps})

        const newProduct = await ProductModel.findById(id)

        await redisClient.set(id, JSON.stringify(newProduct))
        await redisClient.expire(id, 3600)

        res.json({
            msg: `successfully updated product by ${id}`,
            product: newProduct
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const deleteProduct = async (req, res) => {
    const {id} = req.params
    try {
        const product = await ProductModel.findById(id)
        if (!product) {
            return res.status(404).json({
                message: `There is no product to delete from DB`
            })
        }

        const deleteProduct = Promise.all([
            ProductModel.deleteOne({_id: id}),
            redisClient.del(id)
        ])

        await deleteProduct

        res.json({
            message: `successfully deleted data by ${id}`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const createReplyToProduct = async (req, res) => {
    const {memo} = req.body
    const {productId} = req.params
    try {
        const productFromDB = await ProductModel.findById(productId)

        if (lodash.isEmpty(productFromDB)) {
            return res.status(404).json({
                message: `The product to reply does not exist`
            })
        }

        const newReply = new ReplyModel({
            product: productId,
            user: req.user._id,
            memo
        })
        const createReply = await newReply.save()

        await redisClient.LPUSH(`${productId} replies`, JSON.stringify(createReply))
        await redisClient.expire(`${productId} replies`, 3600)

        res.json({
            message: 'successfully created new reply',
            replies: newReply
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

export {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    createReplyToProduct
}
