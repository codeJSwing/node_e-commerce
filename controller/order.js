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

        // 데이터가 없는 경우 or db 데이터가 없지만, redis 데이터가 남아있는 경우
        if (lodash.size(ordersFromDB) === 0 || (lodash.size(ordersFromRedis) > 1 && lodash.size(ordersFromDB) === 0)) {
            return res.status(200).json({
                message: `There is no order to get from any DB`
            })
        }

        // redis data 와 db data 가 일치하는 경우
        if (lodash.size(parsedRedis) > 0 && (lodash.size(ordersFromDB) === lodash.size(parsedRedis))) {
            orders = parsedRedis
            message = `successfully get all orders from Redis`
        }

        // redis 데이터가 만료된 경우 (없는 경우)
        if (lodash.size(parsedRedis) === 0) {
            await redisClient.set('orders', JSON.stringify(ordersFromDB))
            await redisClient.expire('orders', 1800)
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
        let order, message;
        const orderFromDB = await OrderModel
            .findById(id)
            .populate('product', ['name', 'price', 'desc'])
            .populate('user')
        const orderFromRedis = await redisClient.get(id)

        // 조회하려는 주문이 없을 때
        if (!orderFromDB) {
            return res.status(400).json({
                msg: 'There is no order to get'
            })
        }

        // 등록된 주문의 사용자와 조회하려는 사용자가 다를 때
        if (!lodash.isEqual(orderFromDB.user._id, req.user._id)) {
            return res.status(401).json({
                msg: 'This is not your order'
            })
        }

        // redis data 와 db 데이터가 일치할 때
        if (lodash.size(orderFromRedis) > 0 && (lodash.size(orderFromDB) === lodash.size(orderFromRedis))) {
            order = orderFromRedis
            message = `successfully get order by ${id} from Redis`
        }

        // redis data 가 없거나, redis data 와 db 데이터가 일치하지 않을 때
        if ((lodash.size(orderFromRedis) === 0 && lodash.size(orderFromDB) > 1) || (lodash.size(orderFromRedis) > 0 && (lodash.size(orderFromDB) !== lodash.size(orderFromRedis)))) {
            await redisClient.set(id, JSON.stringify(orderFromDB))
            order = orderFromDB
            message = `successfully get order by ${id} from DB`
        }

        res.json({
            message,
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
        const updateOps = req.body
        await OrderModel.findByIdAndUpdate(id, { $set: updateOps })
        res.json({
            message: `successfully updated data by ${id}`
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
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