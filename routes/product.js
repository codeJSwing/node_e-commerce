import express from "express"
import productModel from "../models/product.js"
const router = express.Router()


router.get("/", (req, res) => {
    res.json({
        msg: "get all products"
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
                    name: result.name,
                    price: result.price
                }
            })
        })
        .catch(err => console.log(err.message))


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