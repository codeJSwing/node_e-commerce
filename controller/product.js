import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisCli from "../config/redis.js";
import lodash from "lodash";

const getAllProducts = async (req, res) => {
    try {
        const productsFromRedis = await redisCli.get('products')
        const productsFromMongo = await ProductModel.find()
        let products, msg

        products = JSON.parse(productsFromRedis)

        // 데이터 자체가 없는 경우
        if (productsFromRedis === null && lodash.isEmpty(productsFromMongo)) {
            return res.json({
                msg: `There is no product to get from any DB`
            })
        }

        // redis 데이터가 있고, db 데이터와 같을 때
        if (productsFromRedis !== null && products.length === lodash.size(productsFromMongo)) {
            msg = `successfully get all products from Redis`
        }

        // DB 에서 가져온 데이터와 Redis 데이터를 비교하여 일치하지 않는 경우
        if (productsFromRedis !== null && lodash.size(productsFromMongo) !== products.length) {
            await redisCli.set('products', JSON.stringify(productsFromMongo))
            products = productsFromMongo
            msg = `successfully get all products from Mongo and set Redis 'products'`
        }

        // redis 'products' key 가 없지만, db 에는 데이터가 있는 경우
        if (productsFromRedis === null && !lodash.isEmpty(productsFromMongo)) {
            await redisCli.set('products', JSON.stringify(productsFromMongo))
            products = productsFromMongo
            msg = `successfully get all products from Mongo and set Redis 'products'`
        }

        res.json({
            msg,
            products: products.map(product => ({
                product_id: product._id,
                name: product.name,
                price: product.price,
                description: product.desc
            }))
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

// todo: 추가, 수정, 삭제 API 하고 나서
// todo: db 에 데이터가 없는데 200 응답
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

// todo: 값을 저장할 때 역순으로 저장하면 최신 정보를 먼저 확인할 수 있는지 보자.
const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const newProduct = new ProductModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()

        // redis 에 'products' 키가 있는 경우
        const productsFromRedis = await redisCli.get('products')
        if (productsFromRedis) {
            const products = JSON.parse(productsFromRedis)
            products.push(createdProduct)
            await redisCli.set('products', JSON.stringify(products))
        }

        // redis 에 'products' 키가 없는 경우
        if (productsFromRedis === null) {
            await redisCli.set('products', JSON.stringify([createdProduct]))
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
            return res.status(400).json({
                msg: `There is no product to update`
            })
        }

        // 값 전체를 덮어씌워버리는 방법
        const productsFromMongo = await ProductModel.find()
        await redisCli.set('products', JSON.stringify(productsFromMongo))

        const replies = await ReplyModel.find({product: id})
        await redisCli.set(id, JSON.stringify({product, replies}))

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
        await redisCli.del('products')
        res.json({
            msg: 'successfully deleted all data in DB & Redis'
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
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
                msg: 'There is no product to delete from DB'
            })
        }

        // redis 데이터 삭제 - 동일한 key
        const productFromRedis = await redisCli.get(id)
        if (productFromRedis !== null) {
            await redisCli.del(id)
        }

        res.json({
            msg: `successfully deleted data by ${id} from Redis`,
            product: productFromDB
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
