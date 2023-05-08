import express from 'express';
import productRouter from '../routes/product.js';

const app = express();

app.use('/product', productRouter);

export default app;