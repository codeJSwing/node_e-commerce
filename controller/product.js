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
        const productPromise = Promise.all([
            redisClient.get('products'),
            ProductModel.find()
        ])
        const [productsFromRedis, productsFromMongo] = await productPromise

        let products, message

        products = JSON.parse(productsFromRedis)

        switch (true) {
            case lodash.isEmpty(productsFromMongo):
                return res.status(404).json({
                    message: `There is no product to get from any DB`
                })

            case !lodash.isEmpty(products) && lodash.size(products) === lodash.size(productsFromMongo):
                message = `successfully get all products from Redis`
                break

            case !lodash.isEmpty(products) && lodash.size(products) !== lodash.size(productsFromMongo):
            default:
                await redisClient.set('products', JSON.stringify(productsFromMongo))
                await redisClient.expire('products', 3600)
                products = productsFromMongo
                message = `successfully get all products from Mongo and set Redis 'products'`
                break
        }

        res.json({
            message,
            products: products.map(product => ({
                product_id: product._id,
                name: product.name,
                price: product.price,
                description: product.desc
            }))
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

/*
* todo
*   promise all 로 한번에 선언 - O
*   예외 처리 (제품) (if -> switch - O)
*       데이터 자체가 없는 경우 - O
*       redis 데이터가 db 데이터와 일치하는 경우 - O
*       redis 데이터가 없고, db 데이터는 있는 경우 - O
*       (product 는 하나이기 때문에 개수를 비교할 필요가 없다)
*   예외 처리 (후기) (if -> switch - O)
*       데이터 자체가 없는 경우 - O
*       redis 데이터가 db 데이터와 일치하는 경우 - O
*       redis 데이터가 없고, db 데이터는 있는 경우 - O
*       DB 에서 가져온 데이터와 Redis 데이터가 일치하지 않는 경우 - O
* */
const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const productPromise = Promise.all([
            redisClient.get(id),
            redisClient.get(`${id} replies`),
            ProductModel.findById(id),
            ReplyModel.find({product: id})
        ])
        const [productFromRedis, repliesFromRedis, productFromDB, repliesFromDB] = await productPromise
        let message, product, replies

        product = JSON.parse(productFromRedis)
        replies = JSON.parse(repliesFromRedis)

        // if (lodash.isEmpty(productFromDB)) {
        //     return res.status(404).json({
        //         message: `There is no product to get any DB`
        //     })
        // }

        switch (true) {
            case lodash.isEmpty(productFromDB):
                return res.status(404).json({
                    message: `There is no product to get any DB`
                })

            case !lodash.isEmpty(product) && lodash.size(product) === lodash.size(productFromDB):
                message = `successfully get product by ${id} from Redis`
                break

            default:
                await redisClient.set(id, JSON.stringify(productFromDB))
                await redisClient.expire(id, 3600)
                message = `successfully get product by ${id} from DB and set Redis`
                product = productFromDB
                break
        }

        switch (true) {
            case !lodash.isEmpty(replies) && lodash.size(replies) === lodash.size(repliesFromDB):
                break

            case lodash.isEmpty(repliesFromDB):
                break

            default:
                await redisClient.set(`${id} replies`, JSON.stringify(repliesFromDB))
                await redisClient.expire(`${id} replies`, 3600)
                replies = repliesFromDB
                break
        }

        res.json({
            message,
            product,
            replies
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

/*
* todo
*   후기를 작성한 제품이 삭제되면 같이(제품과 후기) 삭제되도록
*   예외 처리
*       후기를 작성하고 싶은 제품이 없는 경우 - O
*       key 가 없을 때 - productId 가 일치하는 데이터만 삽입 - O
*       key 가 있을 때 역순으로 삽입 - O
* */
const createReplyToProduct = async (req, res) => {
    const {memo} = req.body
    const {productId} = req.params
    try {
        const promiseData = Promise.all([
            ProductModel.findById(productId),
            ReplyModel.find({product: productId})
        ])
        const [productFromDB, repliesFromDB] = await promiseData
        let replies

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

        switch (true) {
            case lodash.isEmpty(repliesFromDB):
                await redisClient.set(`${productId} replies`, JSON.stringify([createReply]))
                await redisClient.expire(`${productId} replies`, 3600)
                replies = createReply
                break

            case !lodash.isEmpty(repliesFromDB):
                replies = JSON.parse(await redisClient.get(`${productId} replies`))
                replies.unshift(createReply)
                await redisClient.set(`${productId} replies`, JSON.stringify(replies))
                await redisClient.expire(`${productId} replies`, 3600)
                break
        }

        res.json({
            message: 'successfully created new reply',
            replies
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
