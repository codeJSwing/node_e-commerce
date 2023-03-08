import express from "express"
import productModel from "../models/product.js"
const router = express.Router()

// 전체 products 불러오는 API
router.get("/", (req, res) => {
    productModel
        .find()
        .then(products => {
            res.json({
                msg: "successful all products",
                count: products.length,
                products: products
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
})

// 상세(특정) product를 불러오는 API
router.get("/:id", (req, res) => {
    productModel
        .findById(req.params.id)
        .then(product => {
            // 데이터가 없으면
            if(product == null){
                res.json({
                    msg: "no data"
                })
            }
            res.json({
                msg: `successful get product ${req.params.id}`,
                product: product
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })


})

router.post("/create", (req, res) => {
    const newProduct = new productModel({
        name: req.body.productName,
        price: req.body.productPrice,
        desc: req.body.content
    })
    newProduct
        .save()
        .then(result => {
            res.json({
                msg: "post new product.js",
                newProductInfo: {
                    id: result._id,
                    name: result.name,
                    price: result.price,
                    desc: result.desc
                }
            })
        })
        .catch(err => {
             res.status(404).json({
                 msg: err.message
             })
        })
})

router.put("/update", (req, res) => {
    res.json({
        msg: "update data"
    })
})

// 전체 삭제
router.delete("/", (req, res) => {
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
})

// 특정 제품 삭제
router.delete("/:id", (req, res) =>{
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
})

export default router