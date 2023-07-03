import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisClient from "../config/redis.js";
import lodash from "lodash";

/*
        * todo
        *   1. scan 으로 redis 에 저장된 데이터를 찾는다.
        *   2. filter 를 통해 'products/' 문자열이 포함된 키를 찾는다.
        *       1) * 다른 추가적인 제약 조건을 넣어야 한다. -> products 의 하위 계층을 두지 않는 방향으로
        *   3. 찾은 데이터를 넣을 공간을 만든다.
        *   4. 만든 공간에 하나씩 데이터를 넣는다.
        *       1) * Scan 으로 찾은 데이터는 순서가 일정하지 않다.
        * */
const getAllProducts = async (req, res) => {
    try {
        const promiseAll = Promise.all([
            redisClient.scan(0),
            []
        ])
        const [findRedisData, productsBase] = await promiseAll

        const filterRedisKey = findRedisData.keys.filter((key) => key.includes('products/'))

        if (lodash.isEmpty(filterRedisKey)) {
            const productsFromDB = await ProductModel.find()
            if (lodash.isEmpty(productsFromDB)) {
                return res.status(200).json({
                    message: `Successfully get all products but, there is no product`
                })
            } else {
                return res.json({
                    message: `successfully get all products from DB`,
                    products: productsFromDB
                })
            }
        }

        for (let i = 0; i < filterRedisKey.length; i++) {
            const product = await redisClient.get(filterRedisKey[i])
            productsBase.push(JSON.parse(product))
        }

        res.json({
            message: `Successfully get all products`,
            products: productsBase
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const productPromise = Promise.all([
            ProductModel.findById(id),
            redisClient.get(`products/${id}`)
        ])
        const [productFromDB, productFromRedis] = await productPromise

        if (!lodash.isEmpty(productFromRedis)) {
            return res.json({
                message: `successfully get product by ${id}`,
                product: JSON.parse(productFromRedis)
            })
        }

        if (lodash.isEmpty(productFromDB)) {
            return res.status(404).json({
                message: `There is no product to get`
            })
        }

        await redisClient.set(`products/${id}`, JSON.stringify(productFromDB))

        res.json({
            message: `successfully get product by ${id}`,
            product: productFromDB
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

        await redisClient.set(`products/${createdProduct._id}`, JSON.stringify(createdProduct))
        await redisClient.expire(`products/${createdProduct._id}`, 3600)

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

        await redisClient.set(`products/${id}`, JSON.stringify(newProduct))
        await redisClient.expire(`products/${id}`, 3600)

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
            redisClient.del(`products/${id}`)
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

const getReplyToProduct = async (req, res) => {
    const {productId, id} = req.params
    try {
        const replyFromRedis = await redisClient.get(`${productId}/replies/${id}`)
        if (!lodash.isEmpty(replyFromRedis)) {
            return res.json({
                message: `successfully get reply by ${id}`,
                reply: JSON.parse(replyFromRedis)
            })
        }

        let reply

        if (lodash.isEmpty(replyFromRedis)) {
            const replyFromDB = await ReplyModel.findById(id)
            if (lodash.isEmpty(replyFromDB)) {
                return res.status(204).json({
                    message: `There is no reply from any DB`
                })
            }
            reply = replyFromDB
            await redisClient.set(`${productId}/replies/${id}`, JSON.stringify(replyFromDB))
            await redisClient.expire(`${productId}/replies/${id}`, 3600)
        }

        res.json({
            message: `successfully get reply by ${id}`,
            reply
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

        await redisClient.set(`${productId}/replies/${createReply._id}`, JSON.stringify(createReply))
        await redisClient.expire(`${productId}/replies/${createReply._id}`, 3600)

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

const deleteReplyToProduct = async (req, res) => {
    const {productId, id} = req.params
    try {
        const deletePromise = Promise.all([
            redisClient.del(`${productId}/replies/${id}`),
            ReplyModel.findByIdAndDelete(id)
        ])
        await deletePromise

        res.json({
            message: `successfully deleted reply by ${id}`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const updateReplyToProduct = async (req, res) => {
    const {productId, id} = req.params
    try {
        const promiseAll = Promise.all([
            req.body,
            ProductModel.findById(productId)
        ])
        const [updateOps, productFromDB] = await promiseAll

        if (lodash.isEmpty(productFromDB)) {
            return res.status(404).json({
                message: `This product does not exist`
            })
        }

        const updateReply = await ReplyModel.findByIdAndUpdate(id, {$set: updateOps}, {new: true})

        if (lodash.isEmpty(updateReply)) {
            return res.status(404).json({
                message: `This reply does not exist`
            })
        }

        await redisClient.set(`${productId}/replies/${id}`, JSON.stringify(updateReply))
        await redisClient.expire(`${productId}/replies/${id}`, 3600)

        res.json({
            message: `successfully updated reply by ${id}`
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
    createReplyToProduct,
    getReplyToProduct,
    deleteReplyToProduct,
    updateReplyToProduct
}
