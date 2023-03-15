import productModel from "../models/product.js";

const getAllProducts = async (req, res) => {
    try {
        const products = await productModel.find()
        return res.json({
            msg: "successful get products",
            products: products.map(product => ({
                name: product.name,
                price: product.price,
                id: product._id
            }))
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
            return res.json({
                msg: "no data"
            })
        }
        res.json({
            msg: "get data",
            product // 키와 value가 같으면 value를 생략 가능
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
            desc // test할때 desc
        })
        const createdProduct = await newProduct.save()
        return res.json({
            msg: "completed product",
            product: createdProduct
        })

    } catch(err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const updateProduct = async (req, res) => {
    // 업데이트 할 대상자
    // 업데이트 할 내용
    // 데이터가 담겨져 있는 그릇
    const updateOps = {};
    for (const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    productModel
        .findByIdAndUpdate(req.params.id, {$set: updateOps})
        .then(_ => {
            res.json({
                msg: `updated product by ${req.params.id}`
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })

}

const deleteProducts = async (req, res) => {
    productModel
        .deleteMany()
        .then(() => {
            res.json({
                msg: "successful delete data"
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
}

const deleteProduct = async (req, res) =>{
    productModel
        .findByIdAndDelete(req.params.id)
        .then(() => {
            res.json({
                msg: "successful delete product"
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
}

export {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProducts,
    deleteProduct
}