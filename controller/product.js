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
        // redis data가 있으면 먼저 data를 보여준다.
        const productFromRedis = await redisCli.get(id)
        if (productFromRedis !== null) {
            return res.json({
                msg: 'successfully get redis data from Redis',
                product: JSON.parse(productFromRedis)
            })
        }

        // redis data가 없으면 db 에서 데이터를 찾는다.
        const productFromDB = await ProductModel.findById(id)
        if (!productFromDB) {
            return res.status(401).json({
                msg: 'There is no product to get in DB'
            })
        }
        console.log(typeof productFromDB, ': productFromDB-----------', productFromDB)

        // todo: 여기가 문제 왜 map이 안되는거지?
        let filterProduct = await productFromDB.map(_ => {
            return {
                product_id: _._id,
                name: _.name,
                price: _.price,
                description: _.desc
            }
        })
        console.log('filterProduct-----------', filterProduct)

        const replies = await ReplyModel.find({product: id})
        const filterReplies = await replies.map(result => {
            return {
                reply_id: result._id,
                memo: result.memo,
                user_id: result.user,
            }
        })
        console.log('filterReplies-----------', filterReplies)


        await redisCli.set(id, JSON.stringify({
            product: filterProduct,
            replies: filterReplies
        }))

        res.json({
            msg: `successfully get product from DB`,
            product: filterProduct,
            reply: filterReplies
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
        const productsFromDB = await ProductModel.find()
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
