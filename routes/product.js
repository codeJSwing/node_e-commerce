import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct,
    replyProduct
} from "../controller/product.js"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// 장바구니에 등록한 모든 제품을 조회하는 API - 고객
router.get("/", getAllProducts)

// 제품의 상세 페이지 이동 - 모든 사용자
router.get("/:id", getProduct)

// 장바구니에 제품을 등록 - 고객
router.post("/", checkAuth, createProduct)

// 장바구니에 등록한 제품 수량을 수정 - 고객
router.put("/:id", checkAuth, updateProduct)

// 장바구니에 등록한 모든 제품 삭제 - 고객
router.delete("/", checkAuth, deleteAllProducts)

// 장바구니에서 선택한 제품 삭제 - 고객
router.delete("/:id", checkAuth, deleteProduct)

// 제품의 후기 등록 - 고객 (인증 필요)
router.post("/:productId/reply", checkAuth, replyProduct)

// todo : 필요하거나 해보고 싶은 API 목록 정리
// * 네이버 쇼핑을 참조해서 실제 서비스와 비교하면서 구성 *
// 후기 수정, 삭제 - 사용자
// 좋아요 등록, 삭제, 수정 - 사용자

// 판매 제품 등록, 조회, 수정, 삭제 API - 판매자 (사용자 필터링이 필요)

// 모든 제품 조회 - 관리자
// 선택한 제품 삭제 - 관리자 (불법한 제품이 등록되는 등 변수 발생시 관리자 권한으로 삭제)

// 선택한 제품 체크 혹은 모든 제품 체크 (삭제하기 전)
// 활동내역 - 후기, 좋아요 등 활동내역을 확인(보류 - 커뮤니티)

export default router