import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisCli from "../config/redis.js";

const getAllProducts = async (req, res) => {
    try {
        const productsFromRedis = await redisCli.get('products')
        if (productsFromRedis === null) {
            const productsFromDB = await ProductModel.find()
            await redisCli.set('products', JSON.stringify(productsFromDB))
        }
        res.json({
            msg: `successfully get all products`,
            products: JSON.parse(productsFromRedis).map(result => {
                return {
                    product_Id: result._id,
                    name: result.name,
                    price: result.price,
                    description: result.desc
                }
            })
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const productFromRedis = await redisCli.get(id)
        if (productFromRedis === null) {
            const productFromDB = await ProductModel.findById(id)
            const replies = await ReplyModel.find({product: id})
            await redisCli.set(id, JSON.stringify({
                product: productFromDB,
                replies
            }))
            return res.json({
                msg: `successfully get product from DB`,
                product: productFromDB,
                replies
            })
        }
        res.json({
            msg: `successfully get product from Redis`,
            result: JSON.parse(productFromRedis)
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
        const productsFromRedis = await redisCli.get('products')
        if (productsFromRedis) {
            const products = JSON.parse(productsFromRedis)
            products.push(createdProduct)
            await redisCli.set('products', JSON.stringify(products))
        } else {
            const products = await ProductModel.find()
            await redisCli.set('products', JSON.stringify(products))
        }
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
        const product = await ProductModel.findByIdAndUpdate(id, {$set: updateOps})
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
        const productsFromMongo = await ProductModel.deleteMany()
        await redisCli.del('products')
        res.json({
            msg: 'successfully deleted all data in DB & Redis',
            productsFromMongo
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
        const productFromDB = await ProductModel.findByIdAndDelete(id)
        if (!productFromDB) {
            return res.status(400).json({
                msg: 'There is no product to delete from DB'
            })
        }
        const productFromRedis = await redisCli.get(id)
        if (productFromRedis !== null) {
            await redisCli.del(id)
        }
        const products = await ProductModel.find()
        if (products !== null) {
            await redisCli.set('products', JSON.stringify(products))
        }
        res.json({
            msg: `successfully deleted data by ${id} from Redis`
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
        const newReply = new ReplyModel({
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
