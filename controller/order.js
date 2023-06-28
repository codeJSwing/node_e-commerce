import OrderModel from "../model/order.js";
import lodash from "lodash"
import redisClient from "../config/redis.js";
import ReplyModel from "../model/reply.js";
import ProductModel from "../model/product.js";

const getAllOrders = async (req, res) => {
    try {
        const redisScan = await redisClient.scan(0)
        const findKey = redisScan.keys.filter((key) => key.includes(`orders/${req.user._id}`))
        console.log(findKey)

        const ordersFromDB = await OrderModel.find({user: req.user._id})

        if (lodash.isEmpty(ordersFromDB)) {
            res.status(200).json({
                message: `successfully get all orders but, There is no order`
            })
        } else {
            res.json({
                message: `successfully get all orders`,
                orders: ordersFromDB.map(_ => {
                    return {
                        _id: _._id,
                        product: _.product,
                        quantity: _.quantity,
                        user: _.user
                    }
                })
            })
        }
    } catch (err) {
        res.status(500).json({
            msg: err.message
        })
    }
}

const getOrder = async (req, res) => {
    const {id} = req.params
    const userId = req.user._id.toString()
    try {
        const orderFromRedis = await redisClient.get(`orders/${userId}/${id}`)
        const parsedOrder = await JSON.parse(orderFromRedis)

        if (!lodash.isEqual(userId, parsedOrder.user)) {
            return res.status(401).json({
                message: `This is not your order`
            })
        }

        if (!lodash.isEmpty(orderFromRedis) && lodash.isEqual(userId, parsedOrder.user)) {
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
            await redisClient.set(`orders/${userId}/${id}`, JSON.stringify(orderFromDB))
            await redisClient.expire(`orders/${userId}/${id}`, 3600)
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
        const productFromDB = await ProductModel.findById(product)
        if (lodash.isEmpty(productFromDB)) {
            res.status(404).json({
                message: `This product does not exist, change product`
            })
        }

        const newOrder = new OrderModel({
            product,
            quantity,
            user: _id
        })
        const createOrder = await newOrder.save()

        await redisClient.set(`orders/${_id}/${createOrder._id}`, JSON.stringify(createOrder))
        await redisClient.expire(`orders/${_id}/${createOrder._id}`, 3600)

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

        await redisClient.set(`orders/${req.user._id}/${id}`, JSON.stringify(updateOrder))
        await redisClient.expire(`orders/${req.user._id}/${id}`, 3600)

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
        if (lodash.isEmpty(order)) {
            return res.status(404).json({
                message: 'There is no order to delete'
            })
        }

        if (!lodash.isEqual(req.user._id, order.user._id)) {
            return res.status(401).json({
                message: `This is not your order`
            })
        }

        const deletePromise = Promise.all([
            OrderModel.findByIdAndDelete(id),
            redisClient.del(`orders/${req.user._id}/${id}`)
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