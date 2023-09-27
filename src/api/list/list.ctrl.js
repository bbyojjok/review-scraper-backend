import Joi from 'joi';
import List from '../../models/list.js';
import { createReview } from '../../models/review.js';
import {
  scrapingStart,
  scrapingDetailGooglePlay,
  scrapingDetailAppStore,
} from '../../process/scrap.js';

const validtationAppId = async ({ googlePlayAppId, appStoreId }) => {
  const googlePlay = await scrapingDetailGooglePlay(googlePlayAppId);
  const appStore = await scrapingDetailAppStore(appStoreId);

  const result = { googlePlay, appStore, error: null };
  const err = (!googlePlay && 'googlePlayAppId') || (!appStore && 'appStoreId');
  if (err) {
    result.error = `${err} validation failed`;
  }

  return result;
};

/* 리스트 추가
POST /api/list
{
  "name": "thehyundai",
  "googlePlayAppId": "com.hdmallapp.thehyundai",
  "appStoreId": 1067693191
}
*/
export const write = async (req, res) => {
  const { name, googlePlayAppId, appStoreId } = req.body;

  // validation
  const schema = Joi.object().keys({
    name: Joi.string().required(),
    googlePlayAppId: Joi.string().required(),
    appStoreId: Joi.number().required(),
  });
  const result = schema.validate(req.body);
  if (result.error) {
    return res.status(400).json(result.error);
  }

  // db에 같은 name이 존재하는지 체크
  const existList = await List.findOne({ name }).exec();
  if (existList) {
    return res.status(400).json({ error: `exist` });
  }

  // googlePlayAppId, appStoreId 유효한 id값인지 체크
  const { googlePlay, appStore, error } = await validtationAppId({
    googlePlayAppId,
    appStoreId,
  });
  if (error) {
    return res.status(400).json({ error });
  }

  // list 저장
  const list = new List({
    name,
    googlePlayAppId,
    appStoreId,
    googlePlay,
    appStore,
  });
  try {
    await list.save();
  } catch (e) {
    return res.status(500).json(e);
  }

  // db 저장후 스키마 모델 생성
  const Review = await createReview(name);

  // 스크랩 시작
  scrapingStart({ name, googlePlayAppId, appStoreId, Review });

  return res.json(list);
};

/* 리스트 조회
GET /api/list/:name?
GET /api/list/
GET /api/list/thehyundai
*/
export const list = async (req, res) => {
  const { name } = req.params;

  if (name) {
    try {
      const queryResult = await List.findOne({ name }).exec();
      if (!queryResult) {
        return res.status(404);
      }
      return res.json(queryResult);
    } catch (e) {
      return res.status(500).json(e);
    }
  }

  try {
    const queryResult = await List.find({}).exec();
    if (!queryResult) {
      return res.status(404);
    }

    // 우선순위 순서 맞추기
    if (queryResult.length < 4) {
      return res.json(queryResult);
    }
    const fixedName = ['thehyundai', 'tohome', 'hmall'];
    const topArr = new Array(fixedName.length).fill(0);
    const bodyArr = queryResult.reduce((acc, current) => {
      if (fixedName.indexOf(current.name) >= 0) {
        topArr[fixedName.indexOf(current.name)] = current;
      } else {
        acc.push(current);
      }
      return acc;
    }, []);
    const resultData = topArr.concat(bodyArr);

    return res.json(resultData);
  } catch (e) {
    return res.status(500).json(e);
  }
};

/* 리스트 삭제
DELETE /api/list/:name
*/
export const remove = async (req, res) => {
  const { name } = req.params;

  try {
    await List.findByIdAndRemove(name).exec();
  } catch (e) {
    return res.status(500).json(e);
  }
};

/*
리스트 수정
PATCH /api/list/:name
{
  "name": "thehyundai",
  "googlePlayAppId": "com.hdmallapp.thehyundai",
  "appStoreId": 1067693191
}
*/
