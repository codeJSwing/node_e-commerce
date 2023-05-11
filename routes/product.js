import express from "express"
import {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteAllProducts,
    deleteProduct, replyToProduct
} from "../controller/product.js"
import passport from "passport";

const checkAuth = passport.authenticate('jwt', {session: false})

const router = express.Router()

/**
 * @swagger
 * paths:
 *  /api/product:
 *    get:
 *      summary: "쇼핑몰에 등록된 모든 제품 조회 - 관리자"
 *      description: "서버에 데이터를 보내지 않고 Get 방식으로 요청"
 *      tags: [Product]
 *      responses:
 *        "200":
 *          description: 전체 유저 정보
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                    ok:
 *                      type: boolean
 *                    products:
 *                      type: array
 *                      items:
 *                        type: object
 *                        properties:
 *                          product_id:
 *                            type: string
 *                          name:
 *                            type: string
 *                          price:
 *                            type: number
 *                          description:
 *                            type: string
 *                      example:
 *                        - product_id: "645c6e83b9e1ccb37c920ae7"
 *                          name: "iPad Pro 11"
 *                          price: 1390000
 *                          description: "프로급 워크플로를 위한 막강한 성능과 온종일 가는 배터리 사용 시간을 구현하는 Apple M2 칩¹\nProMotion, True Tone, P3의 넓은 색영역을 갖춘 27.9cm Liquid Retina 디스플레이각주²\nLiDAR 스캐너를 탑재한 프로급 카메라, 센터 스테이지 기술이 적용된 울트라 와이드 전면 카메라\n가장 빠른 Wi-Fi 연결성을 선사하는 Wi-Fi 6E 그리고 초고속 다운로드 및 고화질 스트리밍이 가능한 5G.³\nApple Pencil(2세대),Magic Keyboard, Smart Keyboard Folio과 호환각주⁴"
 */
router.get("/", getAllProducts)

// 제품의 상세 페이지 이동 - 모든 사용자
router.get("/:id", getProduct)

// 판매 제품 등록 - 판매자
router.post("/", checkAuth, createProduct)

// 등록한 판매 제품 수정 - 판매자
router.put("/:id", updateProduct)

// 등록된 모든 제품 삭제 - 판매자
router.delete("/", checkAuth, deleteAllProducts)

// 한가지 상품 삭제 - 판매자
router.delete("/:id", checkAuth, deleteProduct)

// 제품의 후기 등록 - 고객 / 인증 필요
router.post("/:productId/reply", checkAuth, replyToProduct)

export default router