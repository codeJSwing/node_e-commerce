import productModel from "../models/product.js";
import replyModel from "../models/reply.js";

const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find()
        res.json({
            msg: "successful get products",
            products: products.map(product => {
                return {
                    name: product.name,
                    price: product.price,
                    id: product._id
                }
            })
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const getProduct = async (req, res) => {
    const {id} = req.params
    try{
        const product = await productModel.findById(id)
        const replys = await replyModel.find({product: id})
        if(!product){
            return res.status(404).json({
                msg: "There is no product to get"
            })
        }
        res.json({
            msg: `successful get data`,
            product,
            replys: replys.map(reply => {
                return {
                    user: reply.user,
                    memo: reply.memo,
                    updateTime: reply.updatedAt,
                    id: reply._id
                }
            })
        })
    } catch(err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const createProduct = async (req, res) => {
    const {name, price, desc} = req.body
    try {
        const newProduct = new productModel({
            name,
            price,
            desc
        })
        const createdProduct = await newProduct.save()
        return res.json({
            msg: `successfully created new product`,
            product: createdProduct
        })
    } catch(err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

// todo: body 의 raw로 수정하는 것보다 xxx 타입으로 수정할 수 있을 지 찾아보자
const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const updateOps = {};
        for (const ops of req.body){
            updateOps[ops.propName] = ops.value;
        }
        const product = await productModel.findByIdAndUpdate(id, {$set: updateOps})
        if (!product) {
            return res.status(410).json({
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
            msg: `successfully deleted all data`,
            products
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const deleteProduct = async (req, res) =>{
    const {id} = req.params
    try {
        const product = await productModel.findByIdAndDelete(id)
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
            msg: `successfully created new reply`,
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