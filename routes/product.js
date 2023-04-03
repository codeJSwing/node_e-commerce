import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct, replyProduct
} from "../controller/product.js"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

// todo: 총 주문금액, 배송비, 상품금액, 발송 예상시간
// 장바구니 조회 - 로그인 하지 않은 상태 -> 이건 주문의 영역아닌가?
// 제품 전체 조회
router.get("/", getAllProducts)

router.get("/:id", checkAuth, getProduct)

router.post("/", createProduct)

router.put("/:id", updateProduct)

router.delete("/", checkAuth, deleteAllProducts)

router.delete("/:id", deleteProduct)

// 프로덕트에 대한 댓글
router.post("/:productId/reply", checkAuth, replyProduct)

// todo: 주문자만 정보를 수정하고 삭제할 수 있게 수정
// todo: postman 전부 test 해봐

export default router