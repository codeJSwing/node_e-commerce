import productModel from "../model/product.js";
import replyModel from "../model/reply.js";
import redisCli from "../config/redis.js";

const getAllProducts = async (req, res) => {
    try {
        const productFromMongo = await productModel.find()
        const productFromRedis = await redisCli.get('products')
        if (productFromRedis !== null) {
            console.log('redis')
            return res.json({
                products: JSON.parse(productFromRedis)
            })
        }
        console.log('mongo')
        await redisCli.set('products', JSON.stringify(productFromMongo))
        res.json({
            products: productFromMongo
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

// todo: 코드 리팩토링 해야 할 듯 너무 길다
const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const products = await productModel.find()
        const product = await productModel.findById(id)
        const replies = await replyModel.find({product: id})
        const redisProducts = await redisCli.get('products')
        if (redisProducts !== null) {
            const parsedRedis = JSON.parse(redisProducts);
            const redisProduct = parsedRedis.find(item => item._id === id);
            console.log('redis')
            return res.json({
                msg: 'successfully get redis data',
                product: redisProduct,
                replies: replies.map(reply => {
                    return {
                        user: reply.user,
                        memo: reply.memo,
                        updateTime: reply.updatedAt,
                        id: reply._id
                    }
                })
            })
        }
        if (!product) {
            return res.status(401).json({
                msg: 'There is no product to get'
            })
        }
        console.log('mongo')
        await redisCli.set('products', JSON.stringify(products))
        res.json({
            msg: `successful get data`,
            product,
            replies: replies.map(reply => {
                return {
                    user: reply.user,
                    memo: reply.memo,
                    updateTime: reply.updatedAt,
                    id: reply._id
                }
            })
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

// todo: productId로 등록해서 조회할 때도 그렇게 나오도록
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
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const updateOps = {};
        for (const ops of req.body) {
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
            msg: 'successfully deleted all data',
            products
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const deleteProduct = async (req, res) => {
    const {id} = req.params
    try {
        const product = await productModel.findByIdAndDelete(id)
        if (!product) {
            return res.status(404).json({
                msg: 'There is no product to delete'
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
            msg: 'successfully created new reply',
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