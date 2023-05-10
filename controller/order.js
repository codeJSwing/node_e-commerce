import OrderModel from "../model/order.js";
import lodash from "lodash"
import redisClient from "../config/redis.js";

const getAllOrders = async (req, res) => {
    try {
        let orders, message;
        const ordersFromDB = await OrderModel
            .find()
            .populate('product', ['name', 'price'])
            .populate('user', ['email', 'username', 'phoneNumber'])
        const ordersFromRedis = await redisClient.get('orders')
        const parsedRedis = await JSON.parse(ordersFromRedis)

        // 데이터가 없는 경우
        if (lodash.size(parsedRedis) === 0 && lodash.size(ordersFromDB) === 0) {
            return res.status(200).json({
                message: `There is no order to get from any DB`
            })
        }

        // redis data 와 db data 가 일치하는 경우
        if (lodash.size(parsedRedis) > 0 && (lodash.size(ordersFromDB) === lodash.size(parsedRedis))) {
            orders = parsedRedis
            message = `successfully get all orders from Redis`
        }

        // redis data 가 없는 경우
        if (lodash.size(parsedRedis) === 0) {
            await redisClient.set('orders', JSON.stringify(ordersFromDB))
            orders = ordersFromDB
            message = `successfully get all orders from DB`
        }

        res.json({
            message,
            orders
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
        const order = await OrderModel
            .findById(id)
            .populate('product', ['name', 'price', 'desc'])
            .populate('user')
        if (!order) {
            return res.status(400).json({
                msg: 'There is no order to get'
            })
        }
        if (!lodash.isEqual(order.user._id, req.user._id)) {
            return res.status(401).json({
                msg: 'This is not your order'
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
    const { _id } = req.user
    const { product, quantity } = req.body
    try {
        const newOrder = new OrderModel({
            product,
            quantity,
            user: _id
        })
        const order = await newOrder.save()
        res.json({
            msg: 'successful create new order',
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
        const updateOrder = await OrderModel.findByIdAndUpdate(id, { $set: updateOps })
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
        const orders = await OrderModel.deleteMany()
        res.json({
            msg: 'successfully deleted all data',
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
        const order = await OrderModel.findByIdAndDelete(id)
        if (!order) {
            return res.status(410).json({
                msg: 'There is no order to delete'
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