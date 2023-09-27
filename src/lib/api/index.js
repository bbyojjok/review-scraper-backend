import server from './server.js';

export const getList = () => server.get('/api/list');

export const getReviewDay = (url) => server.get(url);
