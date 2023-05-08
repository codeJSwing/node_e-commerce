import request from 'supertest';
import app from '../test/server.js'; // 서버를 시작하는 코드가 있는 파일

// describe : 같은 기능을 묶는 기능?
describe('GET /product', () => {
    it('should return all products', async () => {
        const res = await request(app).get('/product');
        expect(res.status).toBe(200);
        // expect(res.body).toHaveProperty('message');
        // expect(res.body).toHaveProperty('products');
    });
});