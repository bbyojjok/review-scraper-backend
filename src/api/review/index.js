import express from 'express';
import * as reviewCtrl from './review.ctrl.js';

const route = express.Router();

route.get('/day/:name/:day?/:score?/:os?', reviewCtrl.readDay);
route.get('/date/:name/:from?/:to?/:os?/:score?', reviewCtrl.readDate);
route.get('/xlsx/:name/:day?', reviewCtrl.xlsx);
route.post('/scrap', reviewCtrl.scrap);

export default route;
