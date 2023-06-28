import OrderModel from "../model/order.js";
import lodash from "lodash"
import redisClient from "../config/redis.js";
import ReplyModel from "../model/reply.js";
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
                .populate('user', ['email']),
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
        const orderFromRedis = await redisClient.get(`orders/${id}`)
        const parsedOrder = await JSON.parse(orderFromRedis)

        if (!lodash.isEqual(req.user._id.toString(), parsedOrder.user._id)) {
            return res.status(401).json({
                message: `This is not your order`
            })
        }

        if (!lodash.isEmpty(orderFromRedis) && lodash.isEqual(req.user._id.toString(), parsedOrder.user._id)) {
            return res.json({
                message: `successfully get order by ${id}`,
                order: parsedOrder
            })
        }

        const orderFromDB = await OrderModel
            .findById(id)
            .populate('product', ['name', 'price', 'desc'])
            .populate('user', ['email', 'name', 'username'])
        if (lodash.isEmpty(orderFromDB)) {
            return res.status(404).json({
                message: `There is no order to get`
            })
        }

        if (!lodash.isEqual(req.user._id, orderFromDB.user._id)) {
            return res.status(401).json({
                message: `This order is not your order`
            })
        }

        if (!lodash.isEmpty(orderFromDB)) {
            await redisClient.set(`orders/${id}`, JSON.stringify(orderFromDB))
            await redisClient.expire(`orders/${id}`, 3600)
        }

        res.json({
            message: `successfully get order by ${id}`,
            order: orderFromDB
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

        await redisClient.set(`orders/${createOrder._id}`, JSON.stringify(createOrder))
        await redisClient.expire(`orders/${createOrder._id}`, 3600)

        res.json({
            message: `successfully created new order(${createOrder._id})`,
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
        const orderFromDB = await OrderModel.findById(id)

        if (lodash.isEmpty(orderFromDB)) {
            return res.status(404).json({
                message: `There is no order to update`
            })
        }

        if (!lodash.isEqual(orderFromDB.user._id, req.user._id)) {
            res.status(401).json({
                message: `This is not your order. Couldn't update order`
            })
        }

        const updateOps = req.body
        const productFromDB = await ProductModel.findById(req.body.product)
        if (lodash.isEmpty(productFromDB)) {
            res.status(404).json({
                message: `This product does not exist`
            })
        }

        const updateOrder = await OrderModel.findByIdAndUpdate(id, {$set: updateOps}, {new: true})

        await redisClient.set(`orders/${id}`, JSON.stringify(updateOrder))
        await redisClient.expire(`orders/${id}`, 3600)

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