import OrderModel from "../model/order.js";
import lodash from "lodash"
import redisClient from "../config/redis.js";
import ProductModel from "../model/product.js";

/*
* todo
*   promise all 로 선언 - O
*   조회하려는 데이터가 없는 경우 (DB) - O
*   redis 데이터와 db 데이터가 일치하는 경우 - O
*   DB 데이터는 존재하지만, redis 데이터가 없는 경우 - O
*   redis 데이터와 DB 데이터가 일치 하지 않는 경우 - O
* */
const getAllOrders = async (req, res) => {
    try {
        const promiseOrder = Promise.all([
            OrderModel
                .find()
                .populate('product', ['name', 'price'])
                .populate('user', ['email', 'username', 'phoneNumber']),
            redisClient.get('orders'),
        ])
        const [ordersFromDB, ordersFromRedis] = await promiseOrder
        let orders, message;

        orders = await JSON.parse(ordersFromRedis)

        switch (true) {
            case lodash.isEmpty(ordersFromDB):
                return res.status(404).json({
                    message: `There is no order to get`
                })

            case !lodash.isEmpty(orders) && lodash.size(orders) === lodash.size(ordersFromDB):
                message = `successfully get all orders from Redis`
                break

            case lodash.isEmpty(orders) && !lodash.isEmpty(ordersFromDB)
            || !lodash.isEmpty(orders) && lodash.size(orders) !== lodash.size(ordersFromDB):
                await redisClient.set('orders', JSON.stringify(ordersFromDB))
                await redisClient.expire('orders', 1800)
                orders = ordersFromDB
                message = `successfully get all orders from DB and set Redis`
                break
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
    const {id} = req.params
    try {
        const promiseOrder = Promise.all([
            OrderModel
                .findById(id)
                .populate('product', ['name', 'price', 'desc'])
                .populate('user'),
            redisClient.get(id)
        ])
        const [orderFromDB, orderFromRedis] = await promiseOrder
        let order

        if (lodash.isEmpty(orderFromDB)) {
            return res.status(404).json({
                message: `There is no order to get`
            })
        }

        if (lodash.isEmpty(orderFromRedis)) {
            await redisClient.set(id, JSON.stringify(orderFromDB))
            order = orderFromDB
        } else {
            order = JSON.parse(orderFromRedis)
        }

        res.json({
            message: `successfully get order by ${id}`,
            order
        })
    } catch (e) {
        res.status(500).json({
            msg: e.message
        })
    }
}

const createOrder = async (req, res) => {
    const {_id} = req.user
    const {product, quantity} = req.body
    try {
        const newOrder = new OrderModel({
            product,
            quantity,
            user: _id
        })
        const createOrder = await newOrder.save()

        await redisClient.set(`${createOrder._id}`, JSON.stringify(createOrder))
        await redisClient.expire(`${createOrder._id}`, 3600)

        res.json({
            message: 'successfully created new order',
            order: createOrder
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

const updateOrder = async (req, res) => {
    const {id} = req.params
    try {
        const order = await OrderModel.findById(id)

        if (!order) {
            return res.status(404).json({
                message: `There is no order to update`
            })
        }

        const updateOps = req.body
        await OrderModel.updateOne({_id: id}, {$set: updateOps})

        const newOrder = await OrderModel.findById(id)

        await redisClient.set(id, JSON.stringify(newOrder))
        await redisClient.expire(id, 3600)

        res.json({
            message: `successfully updated data by ${id}`
        })
    } catch (err) {
        res.status(500).json({
            message: err.message
        })
    }
}

const deleteOrder = async (req, res) => {
    const {id} = req.params
    try {
        const order = await OrderModel.findById(id)
        if (!order) {
            return res.status(404).json({
                message: 'There is no order to delete'
            })
        }

        if (!(lodash.isEqual(req.user._id, order.user._id))) {
            return res.status(403).json({
                message: `User information is different`
            })
        }

        const deletePromise = Promise.all([
            OrderModel.findByIdAndDelete(id),
            redisClient.del(id)
        ])
        await deletePromise

        res.json({
            message: `successfully deleted data by ${id}`
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

export {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder
}