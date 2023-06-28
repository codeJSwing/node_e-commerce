import express from "express"
import {
    getAllOrders,
    getOrder,
    createOrder,
    updateOrder,
    deleteOrder
} from "../controller/order.js";
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// 장바구니에 담긴 모든 주문 조회 - 고객 / 인증 필요
router.get("/", checkAuth, getAllOrders)

// 상세 주문조회 - 언제 필요할 지 생각해보자.
router.get("/:id", checkAuth, getOrder)

// 장바구니 등록 - 고객 / 인증 필요
router.post("/", checkAuth, createOrder)

// 주문 수량 수정 - 고객
router.put("/:id", checkAuth, updateOrder)

// 한 제품에 대한 주문만 삭제 - 고객
router.delete("/:id", checkAuth, deleteOrder)

export default router