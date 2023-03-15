import express from "express"
import orderModel from "../models/order.js";
import checkAuth from "../middleware/check-auth.js";
import userModel from "../models/user.js";
const router = express.Router()

router.get("/", checkAuth, async (req, res) => {
    try {
        const order = await orderModel
            .find()
            .populate("product", ["name", "price"])
            .populate("user")
        res.json({
            msg: `successful get order`,
            order
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
})

router.get("/:id", checkAuth, async (req, res) => {
    const {id} = req.params
    try {
        const order = await orderModel.findById(id)
        if (!order) {
            return res.json({
                msg: `no order`
            })
        }
        res.json({
            msg: `successful get order by ${id}`,
            order
        })

    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

router.post("/", checkAuth, async (req, res) => {
    try {
        const {userId} = req.user
        const newOrder = new orderModel({
            product: req.body.product,
            quantity: req.body.quantity,
            user: userId
        })
        const order = newOrder.save()
        res.json({
            msg: `successful create new order`,
            order
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
})

router.put("/update", (req, res) => {
})

// 전체 삭제
router.delete("/", (req, res) => {
    orderModel
        .deleteMany()
        .then(() => {
            res.json({
                msg: "successful all data delete"
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
})

// 일부 삭제
router.delete("/:id", (req, res) =>{
    orderModel
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.json({
                msg: "successful delete a data"
            })
        })
        .catch(err => {
            res.json({
                msg: err.message
            })
        })
})

export default router