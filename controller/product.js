import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisClient from "../config/redis.js";
import lodash from "lodash";

/*
* todo
* 1. 병렬 처리 (promise all) - O
*
* 예외 처리
* 1. 데이터 자체가 없는 경우 - O
* 2. redis 데이터가 있고, db 데이터와 같을 때 - O
* 3. DB 에서 가져온 데이터와 Redis 데이터를 비교하여 일치하지 않는 경우 - O
* 4. redis 'products' key 가 없지만, db 에는 데이터가 있는 경우 - O
* */
const getAllProducts = async (req, res) => {
    try {
        const productPromise = Promise.all([
            redisClient.get('products'),
            ProductModel.find()
        ])
        const [productsFromRedis, productsFromMongo] = await productPromise

        let products, message

        products = JSON.parse(productsFromRedis)

        if (lodash.size(products) === 0 && lodash.size(productsFromMongo) === 0) {
            return res.status(400).json({
                message: `There is no product to get from any DB`
            })
        }

        if (productsFromRedis !== null && products.length === lodash.size(productsFromMongo)) {
            message = `successfully get all products from Redis`
        }

        if (productsFromRedis !== null && lodash.size(productsFromMongo) !== products.length) {
            await redisClient.set('products', JSON.stringify(productsFromMongo))
            products = productsFromMongo
            message = `successfully get all products from Mongo and set Redis 'products'`
        }

        if (productsFromRedis === null && !lodash.isEmpty(productsFromMongo)) {
            await redisClient.set('products', JSON.stringify(productsFromMongo))
            products = productsFromMongo
            message = `successfully get all products from Mongo and set Redis 'products'`
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

const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        // redis key(id) 를 읽어서 상수에 대입
        const productFromRedis = await redisClient.get(id)
        const repliesFromRedis = await redisClient.get(`${id} replies`)

        const productFromDB = await ProductModel.findById(id)
        const repliesFromDB = await ReplyModel.find({product: id})
        let message, product, replies

        // redis 데이터와 db 데이터 모두 없는 경우
        if (lodash.size(productFromRedis) === 0 && lodash.size(productFromDB) === 0) {
            return res.status(400).json({
                message: `There is no product to get any DB`
            })
        }

        // redis 데이터가 없고, db 데이터는 있는 경우
        if (lodash.size(productFromRedis) === 0 && lodash.size(productFromDB) > 1) {
            await redisClient.set(id, JSON.stringify(productFromDB))
            await redisClient.expire(id, 3600)
            message = `successfully get product from DB`
            product = productFromDB
        }

        // 입력한 id 값에 해당하는 redis key 가 있는 경우
        if (lodash.size(productFromRedis) > 0) {
            message = `successfully get product by ${id} from Redis`
            product = JSON.parse(productFromRedis)
        }

        // replies Redis data 가 있는 경우
        if (lodash.size(repliesFromRedis) > 0) {
            replies = JSON.parse(repliesFromRedis)
        }

        // replies Redis data 가 없는 경우
        if (lodash.size(repliesFromRedis) === 0 && lodash.size(repliesFromDB) > 1) {
            replies = repliesFromDB
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
        let products;
        const newProduct = new ProductModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()

        // redis 에 'products' 키가 있는 경우
        const productsFromRedis = await redisClient.get('products')
        if (lodash.size(productsFromRedis) > 0) {
            products = JSON.parse(productsFromRedis)
            products.unshift(createdProduct)
        }

        // redis 에 'products' 키가 없는 경우
        if (lodash.size(productsFromRedis) === 0) {
            products = [createdProduct]
        }

        await redisClient.set('products', JSON.stringify(products))
        await redisClient.expire('products', 3600)

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

/*
* todo
* 1. DB의 데이터가 없는 경우 - O
* 2. redis 데이터 덮어씌우기 - O
* 3. product key 는 어떻게 할 것인지?
* */
const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const updateOps = req.body
        const product = await ProductModel.findByIdAndUpdate(id, {$set: updateOps})

        if (!product) {
            return res.status(400).json({
                message: `There is no product to update`
            })
        }

        await redisClient.set(id, JSON.stringify(product))

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

// todo: id 값을 키로 가진 데이터들은 자연스럽게 만료되서 사라지도록 구성하자.
// todo: key 앞에 product 를 붙여서 필터링해서 삭제할까?
const deleteAllProducts = async (req, res) => {
    try {
        await ProductModel.deleteMany()
        await redisClient.del('products')
        res.json({
            message: 'successfully deleted all data in DB & Redis'
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

// todo: products key 의 데이터는 자동으로 삭제되도록
const deleteProduct = async (req, res) => {
    const {id} = req.params
    try {
        // db 데이터 삭제
        const productFromDB = await ProductModel.findByIdAndDelete(id)
        if (!productFromDB) {
            return res.status(400).json({
                message: 'There is no product to delete from DB'
            })
        }

        // redis 데이터 삭제 - 동일한 key
        const productFromRedis = await redisClient.get(id)
        if (productFromRedis !== null) {
            await redisClient.del(id)
        }

        res.json({
            message: `successfully deleted data by ${id}`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

// todo: user 를 id 대신 username 으로 표시
// todo: 후기를 작성한 제품이 삭제되면 자동으로 삭제되도록
const createReplyToProduct = async (req, res) => {
    const {memo} = req.body
    const {productId} = req.params
    try {
        const findProduct = await ProductModel.findById(productId)
        if (!findProduct) {
            return res.status(400).json({
                message: `The product to reply does not exist`
            })
        }

        const newReply = new ReplyModel({
            product: productId,
            user: req.user._id,
            memo
        })
        const reply = await newReply.save()

        // key 가 없을 때 - productId 가 일치하는 데이터만 삽입
        const repliesFromRedis = await redisClient.get(`${productId} replies`)
        if (lodash.size(repliesFromRedis) === 0) {
            const repliesFromDB = await ReplyModel.find({product: productId})
            await redisClient.set(`${productId} replies`, JSON.stringify([repliesFromDB]))
        }

        // key 가 있을 때 (push)
        if (lodash.size(repliesFromRedis) > 0) {
            const replies = JSON.parse(repliesFromRedis)
            replies.unshift(reply)
            await redisClient.set(`${productId} replies`, JSON.stringify(replies))
        }

        res.json({
            message: 'successfully created new reply',
            reply: {
                user: reply.user,
                memo: reply.memo,
                reply_id: reply._id
            }
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
    deleteAllProducts,
    deleteProduct,
    createReplyToProduct
}
