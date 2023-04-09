import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct, replyProduct
} from "../controller/product.js"
import passport from "passport";
import likeModel from "../model/like.js";
import userModel from "../model/user.js";
import productModel from "../model/product.js";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteAllProducts)

router.delete("/:id", deleteProduct)

router.post("/:productId/reply", checkAuth, replyProduct)

// 좋아요
// 중복 허용 안함
// 같은 계정으로 같은 프로덕트에 있는 좋아요는 1번 이상 할 수 없다
// product, user도 찾아야 된다.
// router.post("/:productId/like", checkAuth, async (req, res) => {const {email} = req.user
//     // console.log(req.user)
//
//     const {_id} = req.user
//     // console.log(_id)
//     try {
//         const product = await productModel.findById(req.params.productId)
//         console.log(product._id)
//         const products = await likeModel.find({product: product._id})
//         console.log(!products)
//         if (!products) {
//             const newLike = await new likeModel({
//                 product: req.params.productId,
//                 user: _id
//             })
//             await newLike.save()
//             return res.json({
//                 msg: `successful like`
//             })
//         }
//
//
//
//
//         // // const products = await likeModel.find({product: req.params.productId})
//         // console.log("products", products)
//         // const checkLike = await products.filter(product => product.user !== _id.toString())
//         // // console.log(checkLike)
//         // if (checkLike) {
//         //     return res.status(404).json({
//         //         msg: `이 제품은 이미 좋아요를 눌렀습니다.`
//         //     })
//         // }
//         // const newLike = new likeModel({
//         //     product: req.params.productId,
//         //     user: _id
//         // })
//         // const result = await newLike.save()
//         // res.json({
//         //     msg: `successful like`,
//         //     result
//         // })
//     } catch (e) {
//         res.status(500).json({
//             msg: e.message
//         })
//     }
// })

// 좋아요 해제
router.post("/:productId/unlike", checkAuth, async (req, res) => {

})

export default router