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
            case lodash.isEmpty(products) && lodash.isEmpty(productsFromMongo):
                return res.status(400).json({
                    message: `There is no product to get from any DB`
                })

            case !lodash.isEmpty(products) && lodash.size(products) === lodash.size(productsFromMongo):
                message = `successfully get all products from Redis`
                break

            case lodash.isEmpty(products) && !lodash.isEmpty(productsFromMongo):
                await redisClient.set('products', JSON.stringify(productsFromMongo))
                await redisClient.expire('products', 3600)
                products = productsFromMongo
                message = `successfully get all products from Mongo and set Redis 'products'`
                break

            case !lodash.isEmpty(products) && lodash.size(products) !== lodash.size(productsFromMongo):
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

        console.log('replies length', lodash.size(replies))
        console.log('replies', replies)

        switch (true) {
            case lodash.isEmpty(productFromDB):
                return res.status(400).json({
                    message: `There is no product to get any DB`
                })

            case !lodash.isEmpty(product) && !lodash.isEmpty(productFromDB):
                message = `successfully get product by ${id} from Redis`
                product = JSON.parse(productFromRedis)
                break

            case (lodash.isEmpty(product) && !lodash.isEmpty(productFromDB)):
                await redisClient.set(id, JSON.stringify(productFromDB))
                await redisClient.expire(id, 3600)
                message = `successfully get product by ${id} from DB and set Redis`
                product = productFromDB
                break
        }

        switch (true) {
            case !lodash.isEmpty(replies) && lodash.size(replies) === lodash.size(repliesFromDB):
                replies = JSON.parse(repliesFromRedis)
                break

            case lodash.isEmpty(repliesFromDB):
                break

            case (lodash.isEmpty(replies) && !lodash.isEmpty(repliesFromDB))
            || (!lodash.isEmpty(replies) && lodash.size(replies) !== lodash.size(repliesFromDB)):
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

/*
* todo
*   예외처리
*       1. 데이터가 없는 경우 - O
*       2. 데이터가 존재하는 경우, 역순으로 데이터를 삽입 - O
*       3. 만료기한으로 redis 데이터가 삭제된 경우 - O
*       (조회할 때 응답속도를 더 높이기 위해서 생성할 때마다 레디스에 데이터를 갱신한다.)
* */
const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const promiseProducts = Promise.all([
            redisClient.get('products'),
            ProductModel.find()
        ])
        const [productsFromRedis, productsFromMongo] = await promiseProducts
        let products;

        const newProduct = new ProductModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()

        products = JSON.parse(productsFromRedis)

        switch (true) {
            case lodash.isEmpty(products) && lodash.isEmpty(productsFromMongo):
                products = [createdProduct]
                break

            case !lodash.isEmpty(products) && !lodash.isEmpty(productsFromMongo):
                products.unshift(createdProduct)
                break

            case lodash.isEmpty(products) && !lodash.isEmpty(productsFromMongo):
                products = productsFromMongo
                products.unshift(createdProduct)
                break
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
*   DB의 데이터가 없는 경우 - O
*   redis 데이터 덮어씌우기 - O
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
        await redisClient.expire(id, 3600)

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

/*
* todo
*   db, redis 데이터 동시 삭제 - O
*   'product' key redis 데이터는 이 API 에서는 삭제하지 않는다.
*   (만료기한을 따로 설정해뒀기 때문에)*
* */
const deleteAllProducts = async (req, res) => {
    try {
        const promiseDelete = Promise.all([
            ProductModel.deleteMany(),
            redisClient.del('products')
        ])
        await promiseDelete

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
