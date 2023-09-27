import express from 'express';
import * as authCtrl from './auth.ctrl.js';

const route = express.Router();

route.post('/login', authCtrl.login);
route.get('/check', authCtrl.check);
route.get('/logout', authCtrl.logout);

export default route;
