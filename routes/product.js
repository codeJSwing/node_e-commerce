import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    createReplyToProduct, getReplyToProduct, deleteReplyToProduct, updateReplyToProduct
} from "../controller/product.js"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// 쇼핑몰에 등록된 모든 제품 조회 - 관리자
router.get("/", getAllProducts)

// 제품의 상세 페이지 이동 - 모든 사용자
router.get("/:id", getProduct)

// 판매 제품 등록 - 판매자
router.post("/", checkAuth, createProduct)

// 등록한 판매 제품 수정 - 판매자
router.put("/:id", updateProduct)

// 한가지 상품 삭제 - 판매자
router.delete("/:id", checkAuth, deleteProduct)

// 제품의 후기 등록 - 고객 / 인증 필요
router.post("/:productId/replies", checkAuth, createReplyToProduct)

// 제품의 후기 조회
router.get("/:productId/replies/:id", checkAuth, getReplyToProduct)

// 제품의 후기 삭제
router.delete("/:productId/replies/:id", checkAuth, deleteReplyToProduct)

// 제품의 후기 수정
router.put("/:productId/replies/:id", checkAuth, updateReplyToProduct)

export default router