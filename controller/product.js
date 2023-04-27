import ProductModel from "../model/product.js";
import ReplyModel from "../model/reply.js";
import redisCli from "../config/redis.js";

const getAllProducts = async (req, res) => {
    try {
        const productsFromDB = await ProductModel.find()
        const filterProducts = await productsFromDB.map(result => {
            return {
                productId: result._id,
                name: result.name,
                price: result.price,
                description: result.desc
            }
        })
        const productsFromRedis = await redisCli.get('products')
        if (productsFromRedis !== null) {
            return res.json({
                msg: `successfully get all products from Redis`,
                products: JSON.parse(productsFromRedis)
            })
        }
        redisCli.set('products', JSON.stringify(filterProducts))
        res.json({
            msg: `successfully get all products from DB`,
            products: filterProducts
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

// todo: 조회 이후, 후기를 작성하고 다시 조회하면 후기가 레디스에 등록되지 않는 문제 확인
const getProduct = async (req, res) => {
    const {id} = req.params
    try {
        const productFromDB = await ProductModel.findById(id)
        const reply = await ReplyModel.find({product: id})
        const productFromRedis = await redisCli.get(id)
        if (productFromRedis !== null) {
            console.log('redis')
            return res.json({
                msg: 'successfully get redis data',
                product: JSON.parse(productFromRedis)
            })
        }
        if (!productFromDB) {
            return res.status(401).json({
                msg: 'There is no product to get'
            })
        }
        console.log('mongo')
        await redisCli.set(id, JSON.stringify({product: productFromDB, reply}))
        res.json({
            msg: `successfully get product from DB`,
            product: productFromDB,
            reply: reply.map(reply => {
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

const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const newProduct = new ProductModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()
        // 1. 데이터베이스에서 products 전체 조회
        const productsFromDB = await ProductModel.find()
        // 2. 조회한 데이터를 redis 메모리에 덮어씌우기
        await redisCli.set('products', JSON.stringify(productsFromDB))
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
        const deleteFromRedis = await redisCli.del('products')
        res.json({
            msg: 'successfully deleted all data',
            productsFromMongo,
            deleteFromRedis
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
            return res.status(401).json({
                msg: 'There is no product to delete'
            })
        }
        // 1. products 전체 조회
        const ProductsFromRedis = await redisCli.get('products')
        // 2. string 타입을 JSON 타입으로 변환
        const jsonProducts = await JSON.parse(ProductsFromRedis)
        // 3. 삭제 하려는 id와 같은 id를 찾기
        const deleteProduct = await jsonProducts.filter(product => product._id !== id)
        // 4. 찾은 id에 해당하는 product를 제외한 나머지를 다시 덮어 씌운다. (원하는 product만 지운 효과)
        await redisCli.set('products', JSON.stringify(deleteProduct))
        res.json({
            msg: `successfully deleted data by ${id}`,
            product: productFromDB
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
        // res.status(500)
        // throw new Error(e.message)
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
