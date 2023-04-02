import orderModel from "../models/order.js";

const getAllOrders = async (req, res) => {
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
}

const getOrder = async (req, res) => {
    const { id } = req.params
    try {
        // login 한 사람의 내용만 확인
        // 로그인, ordermodel 주문한 사람 정보

        const order = await orderModel
            .findById(id)
            .populate("product", ["name", "price", "desc"])
            .populate("user")
        if (!order) {
            return res.json({
                msg: `no order`
            })
        }
        if (order.user !== req.user.userId) {
            return res.status(408).json({
                msg: `This is not your order`
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
}

const createOrder = async (req, res) => {
    const { userId } = req.user
    const { product, quantity } = req.body
    try {
        const newOrder = new orderModel({
            product,
            quantity,
            user: userId
        })
        const order = await newOrder.save()
        res.json({
            msg: `successful create new order`,
            order
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const updateOrder = async (req, res) => {
    try {
        const { id } = req.params
        const updateOps = {}
        for (const ops of req.body) {
            updateOps[ops.propName] = ops.value;
        }
        const updateOrder = await orderModel.findByIdAndUpdate(id, { $set: updateOps })
        res.json({
            msg: `successfully updated data by ${id}`,
            updateOrder
        })
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const deleteAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.deleteMany()
        res.json({
            msg: `successfully deleted all data`,
            orders
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const deleteOrder = async (req, res) => {
    const { id } = req.params
    try {
        const order = await orderModel.findByIdAndDelete(id)
        if (!order) {
            return res.status(410).json({
                msg: `There is no order to delete`
            })
        }
        res.json({
            msg: `successfully deleted data by ${id}`,
            order
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

export {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteAllOrders,
    deleteOrder
}