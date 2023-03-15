import express from "express"
import productModel from "../models/product.js"
import product from "../models/product.js";
import checkAuth from "../middleware/check-auth.js";
const router = express.Router()

// 전체 products 불러오는 API
router.get("/", async (req, res) => {
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

})

// 상세(특정) product를 불러오는 API
router.get("/:id", checkAuth, async (req, res) => {
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

    // productModel
    //     .findById(req.params.id)
    //     .then(product => {
    //         // 데이터가 없으면
    //         if(product == null){
    //             res.json({
    //                 msg: "no data"
    //             })
    //         }
    //         res.json({
    //             msg: `successful get product ${req.params.id}`,
    //             product: product
    //         })
    //     })
    //     .catch(err => {
    //         res.status(404).json({
    //             msg: err.message
    //         })
    //     })


})

router.post("/", async (req, res) => {
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

    // newProduct
    //     .save()
    //     .then(result => {
    //         res.json({
    //             msg: "post new product",
    //             newProductInfo: {
    //                 id: result._id,
    //                 name: result.name,
    //                 price: result.price,
    //                 desc: result.desc
    //             }
    //         })
    //     })
    //     .catch(err => {
    //          res.status(404).json({
    //              msg: err.message
    //          })
    //     })
})

router.put("/:id", (req, res) => {
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

})

// 전체 삭제
router.delete("/", checkAuth, (req, res) => {
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