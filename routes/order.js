import express from "express"
const router = express.Router()

router.get("/", (req, res) => {
    res.json({
        msg: "get all orders"
    })
})

router.post("/create", (req, res) => {
    const newOrder = {
        title: req.body.orderTitle,
        place: req.body.orderPlace,
        desc: req.body.content
    }

    res.json({
        msg: "post new order",
        newOrderInfo: newOrder
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