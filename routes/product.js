import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct
} from "../controller/product.js"
import passport from "passport";
import replyModel from "../models/reply.js";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteAllProducts)

router.delete("/:id", deleteProduct)

// 프로덕트에 대한 댓글
router.post("/:productId/reply", checkAuth, async (req, res) => {
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
            msg: `successful create reply`,
            result
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

// todo: 주문자만 정보를 수정하고 삭제할 수 있게 수정
// todo: postman 전부 test 해봐

export default router