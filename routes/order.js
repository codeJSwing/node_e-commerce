import express from "express"
import orderModel from "../models/order.js";
const router = express.Router()

router.get("/", (req, res) => {
    orderModel
        .find()
        .populate("product", ["name", "price"])
        .then(orders => {
            res.json({
                msg: "successful all orders",
                orders: orders
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
})

router.get("/:id", (req, res) => {
    orderModel
        .findById(req.params.id)
        .then(order => {
            if(order == null){
                res.json({
                    msg: "no data"
                })
            }
            res.json({
                msg: `successful get order ${req.params.id}`,
                order: order
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
})

router.post("/", (req, res) => {
    const newOrder = new orderModel({
        product: req.body.orderProduct,
        quantity: req.body.orderQuantity
    })
    newOrder
        .save()
        .then(result => {
            res.json({
                msg: "post new order",
                newOrderInfo: result
            })
        })
        .catch(err => {
            res.status(404).json({
                msg: err.message
            })
        })
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