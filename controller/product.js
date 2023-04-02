import productModel from "../models/product.js";

const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find()

        return res.json({
            msg: "successful get products",
            products: products.map(product => {
                return {
                    name: product.name,
                    price: product.price
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
        if(!product){
            return res.status(404).json({
                msg: "no data"
            })
        }
        res.json({
            msg: `successful get data`,
            product
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

const updateProduct = async (req, res) => {
    const {id} = req.params
    try {
        const updateOps = {};
        for (const ops of req.body){
            updateOps[ops.propName] = ops.value;
        }
        const updateProduct = await productModel.findByIdAndUpdate(id, {$set: updateOps})
        res.json({
            msg: `successfully updated product by ${id}`,
            updateProduct
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const deleteAllProducts = async (req, res) => {
    try {
        const orders = await productModel.deleteMany()
        res.json({
            msg: `successfully deleted all data`,
            orders
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
            msg: `successfully deleted data`,
            product
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
    deleteProduct
}