import OrderModel from "../model/order.js";
import lodash from "lodash"
import redisClient from "../config/redis.js";

/*
* todo
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
            message: 'successfully created new order',
            order
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
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
        await OrderModel.deleteMany()
        res.json({
            message: 'successfully deleted all Orders'
        })
    } catch (e) {
        res.status(500).json({
            message: e.message
        })
    }
}

/*
* todo
*  1. 삭제하려는 주문이 없을 때 - O
*  2. 등록된 주문의 사용자(구매자)와 삭제하려는 사용자의 id가 다를 때 - O
*  3. finally 를 사용한 방식
* */
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

        await OrderModel.findByIdAndDelete(id)
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
    deleteAllOrders,
    deleteOrder
}