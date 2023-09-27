import Dotenv from 'dotenv';
Dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import schedule from 'node-schedule';
import route from './api/index.js';
import Review from './models/review.js';
import { scraping } from './process/scrap.js';
import { getCronRule } from './lib/utility.js';
import { jwtMiddleware } from './lib/jwtMiddleware.js';

const { PORT, MONGO_URI } = process.env;

mongoose.set('strictQuery', true);
mongoose
  .connect(MONGO_URI, { dbName: 'review-scraper', useNewUrlParser: true })
  .then(async () => {
    console.log('[SERVER] Connected to MongoDB');
    await Review();
    // scraping();
  })
  .catch((e) => {
    console.error(e);
  });

const app = express();

const whitelist = [
  'http://localhost:8083',
  'https://localhost:8083',
  'http://review.stlee.kr',
  'https://review.stlee.kr',
];
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(jwtMiddleware);

// 라우트 설정
app.use('/api', route);

const port = PORT || 8082;
app.listen(port, async () => {
  console.log(`[SERVER] Express is listening on port ${port}`);

  // const rule = [`*/${getRandom(2, 10)}`, '*', '*', '*', '*'].join(' ');
  // console.log('rule:', rule);
  // const scrapJob = schedule.scheduleJob(rule, () => {
  //   console.log('## 스케쥴 테스트: 호출!!');

  //   const rule = [`*/${getRandom(2, 10)}`, '*', '*', '*', '*'].join(' ');
  //   console.log('rule:', rule);
  //   scrapJob.reschedule(rule);
  // });

  // const rule = [`*/30`, '*', '*', '*', '*'].join(' ');
  // const scrapJob = schedule.scheduleJob(rule, () => {
  //   console.log('### scraping call !!');
  //   scraping();
  // });

  // 스케쥴 등록
  const scrapJob = schedule.scheduleJob(getCronRule(), () => {
    scraping();

    // 스케쥴 취소 후, 5시간 이후 다시 재등록
    setTimeout(() => scrapJob.reschedule(getCronRule()), 1000 * 60 * 60 * 5);
  });
});
