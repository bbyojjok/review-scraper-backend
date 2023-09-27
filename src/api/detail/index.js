import express from 'express';
import * as detailCtrl from './detail.ctrl.js';

const route = express.Router();

route.get('/:name/:os?', detailCtrl.read);

export default route;
