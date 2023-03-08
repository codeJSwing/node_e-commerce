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
    // res.json({
    //     msg: "get all products"
    // })

})

// 상세(특정) product를 불러오는 API
router.get("/:id", (req, res) => {
    productModel
        .findById(req.params.id)
        .then(product => {
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

router.delete("/delete", (req, res) => {
    res.json({
        msg: "delete data"
    })
})

export default router