import mongoose from 'mongoose';
import moment from 'moment';
import xl from 'excel4node';
import makeDir from 'make-dir';
import { getReviewDay } from '../../lib/api/index.js';
import { scraping } from '../../process/scrap.js';

const reviewDateFormat = (review) => {
  return review.reduce((acc, cur) => {
    const { date, replyDate } = cur.review;
    const format = 'YYYY. MM. DD';
    cur.review.date = moment(date).format(format);
    if (cur.review.replyDate) {
      cur.review.replyDate = moment(replyDate).format(format);
    }
    acc.push(cur);
    return acc;
  }, []);
};

/* 리뷰 조회 (오늘부터 몇일전 기준으로 조회)
GET /api/review/day/name/day?/score?/os?
GET /api/review/day/thehyundai/7/1/googlePlay
GET /api/review/day/thehyundai/7/12345/googlePlay
*/
export const readDay = async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  if (page < 1) {
    return res.status(400);
  }

  const { name, day, score, os } = req.params;
  const Review = mongoose.model(`Review-${name}`);
  const today = moment().startOf('day').format();
  const endday = moment().endOf('day').format();
  const prevday = moment(today).subtract(day, 'days').format();
  const options = {
    date: {
      $gte: day ? prevday : today,
      $lte: endday,
    },
  };
  if (score) {
    options.$or = [
      {
        'review.scoreText': {
          $in: score.split(''),
        },
      },
      {
        'review.rate': {
          $in: score.split(''),
        },
      },
    ];
  }
  if (os) {
    options.os = os;
  }

  try {
    const queryResult = await Review.find(options)
      .sort({ date: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean()
      .exec();
    const queryResultCount = await Review.countDocuments(options).exec();
    if (!queryResult) {
      return res.status(404);
    }

    res.set('Last-page', Math.ceil(queryResultCount / 10));
    res.set('Total-count', queryResultCount);

    const result = reviewDateFormat(queryResult);
    if (!os) {
      const { googlePlay, appStore } = result.reduce(
        (acc, cur) => {
          if (cur.os === 'googlePlay') {
            acc.googlePlay.push(cur);
          }
          if (cur.os === 'appStore') {
            acc.appStore.push(cur);
          }
          return acc;
        },
        { googlePlay: [], appStore: [] },
      );
      return res.json({ googlePlay, appStore });
    }
    return res.json(result);
  } catch (e) {
    return res.status(500).json(e);
  }
};

/* 리뷰 조회 (몇일부터 몇일까지 조회), 텔레그램 메시지 전송용
GET /api/review/date/name/from?/to?/os?/score?
GET /api/review/date/thehyundai/20220505/20220810/googlePlay/1
GET /api/review/date/thehyundai/20220505/today/googlePlay/1
*/
export const readDate = async (req, res) => {
  const { name, from, to, os, score } = req.params;
  const Review = mongoose.model(`Review-${name}`);
  const today = moment().startOf('day').format();
  const endday = moment().endOf('day').format();
  const prevday = moment(today).subtract(1, 'days').format();
  const dateFrom = from ? moment(from, 'YYYYMMDD').format() : prevday;
  const dateTo = to
    ? to === 'today'
      ? endday
      : moment(to, 'YYYYMMDD').endOf('day').format()
    : endday;
  const options = {
    date: { $gte: dateFrom, $lte: dateTo },
  };
  if (score) {
    options.$or = [
      {
        'review.scoreText': {
          $in: score.split(''),
        },
      },
      {
        'review.rate': {
          $in: score.split(''),
        },
      },
    ];
  }
  if (os) {
    options.os = os;
  }

  try {
    const queryResult = await Review.find(options).sort({ date: -1 }).exec();
    if (!queryResult) {
      return res.status(404);
    }

    const result = reviewDateFormat(queryResult);
    return res.json(result);
  } catch (e) {
    return res.status(500).json(e);
  }
};

/* 엑셀 다운 (요일별로 평점 1~5 점까지)
GET /api/review/xlsx/name/day?
GET /api/review/xlsx/thehyundai/7
*/
export const xlsx = async (req, res) => {
  const { name, day } = req.params;
  const url = `/api/review/day/${name}/${day}/12345`;
  const today = moment().startOf('day').format('YYYYMMDD');
  const now = new Date().valueOf();
  const file = `downloads/${today}/review_${name}_${day}_${now}.xlsx`;

  // 폴더 생성
  await makeDir(`public/downloads/${today}`);

  // 엑셀
  const wb = new xl.Workbook();
  const ws1 = wb.addWorksheet(`android - ${day}일 이전`);
  const ws2 = wb.addWorksheet(`ios - ${day}일 이전`);
  const style_head = wb.createStyle({
    font: { bold: true, color: '#000000', size: 13 },
    alignment: { horizontal: ['center'], vertical: ['center'] },
  });
  const style_right = wb.createStyle({ alignment: { horizontal: ['right'] } });
  const style_center = wb.createStyle({
    alignment: { horizontal: ['center'], vertical: ['center'] },
  });

  // android sheet
  ws1.cell(1, 1).string('평점').style(style_head);
  ws1.cell(1, 2).string('날짜').style(style_head);
  ws1.cell(1, 3).string('리뷰').style(style_head);
  ws1.cell(1, 4).string('작성자').style(style_head);
  ws1.column(1).setWidth(10);
  ws1.column(2).setWidth(15);
  ws1.column(3).setWidth(100);
  ws1.column(4).setWidth(30);
  ws1.row(1).setHeight(30).filter();

  // ios sheet
  ws2.cell(1, 1).string('평점').style(style_head);
  ws2.cell(1, 2).string('날짜').style(style_head);
  ws2.cell(1, 3).string('제목').style(style_head);
  ws2.cell(1, 4).string('리뷰').style(style_head);
  ws2.cell(1, 5).string('작성자').style(style_head);
  ws2.column(1).setWidth(10);
  ws2.column(2).setWidth(15);
  ws2.column(3).setWidth(60);
  ws2.column(4).setWidth(100);
  ws2.column(5).setWidth(30);
  ws2.row(1).setHeight(30).filter();

  const { data } = await getReviewDay(url);
  const data_anroid = data.filter((val) => val.os === 'googlePlay');
  if (data_anroid.length > 0) {
    data_anroid.forEach((data, i) => {
      const num = i + 2;
      const { score, date, text, userName } = data.review;
      ws1.cell(num, 1).string(score.toString()).style(style_right);
      ws1.cell(num, 2).string(date).style(style_right);
      ws1.cell(num, 3).string(text);
      ws1.cell(num, 4).string(userName).style(style_right);
    });
  } else {
    ws1.row(2).setHeight(80);
    ws1
      .cell(2, 1, 2, 4, true)
      .string('조회된 리뷰가 없습니다.')
      .style(style_center);
  }

  const data_ios = data.filter((val) => val.os === 'appStore');
  if (data_ios.length > 0) {
    data_ios.forEach((data, i) => {
      const num = i + 2;
      const { rate, date, title, comment, author } = data.review;
      ws2.cell(num, 1).string(rate).style(style_right);
      ws2.cell(num, 2).string(date).style(style_right);
      ws2.cell(num, 3).string(title);
      ws2.cell(num, 4).string(comment);
      ws2.cell(num, 5).string(author).style(style_right);
    });
  } else {
    ws2.row(2).setHeight(80);
    ws2
      .cell(2, 1, 2, 5, true)
      .string('조회된 리뷰가 없습니다.')
      .style(style_center);
  }

  // 엑셀 저장
  wb.write(`public/${file}`, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      return res.json({ file, stats });
    }
  });
};

/* 스크랩 시작
POST /api/review/scrap
*/
export const scrap = async (req, res) => {
  const status = scraping();
  if (!status) {
    return res.json({ status, message: 'scraping playing' });
  }
  res.json({ status, message: 'scraping start' });
};
