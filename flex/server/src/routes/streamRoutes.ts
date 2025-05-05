import { Router } from 'express';
import {streamHandler}  from '../controllers/streamController';

const router = Router();

router.get('/stream/:id', streamHandler);

export default router;
