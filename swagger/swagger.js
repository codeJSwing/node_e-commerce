import swaggerUi from "swagger-ui-express"
import swaggerJsdor from "swagger-jsdoc"

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: '스웨거 테스트',
            description: '프로젝트 설명 Node.js Swagger swagger-jsdoc 방식 RestFul API 클라이언트 UI'
        },
        servers: [
            {
                url: 'http://localhost:3000', // 요청 URL
            },
        ],
    },
    apis: ['./routes/*.js'], // Swagger 파일 연동
}
const specs = swaggerJsdor(options)

export {
    swaggerUi, specs
}