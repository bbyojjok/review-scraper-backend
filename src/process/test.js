import gplay from 'google-play-scraper';
import { trimTitle } from '../lib/utility.js';

export const scrapingDetailGooglePlay = async (appId) => {
  try {
    const { version, score, url, icon, title } = await gplay.app({
      appId,
      lang: 'ko',
      country: 'kr',
    });
    return { version, score, url, icon, title: trimTitle(title) };
  } catch (e) {
    console.error(e);
    return null;
  }
};

const scrapingReviewGooglePlay = async (appId) => {
  try {
    const { data } = await gplay.reviews({
      appId,
      lang: 'ko',
      country: 'kr',
      sort: gplay.sort.NEWEST,
      num: 3000, // 3000
    });
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const reviewGooglePlay = await scrapingReviewGooglePlay(
  'com.hdmallapp.thehyundai',
);
console.log(reviewGooglePlay);

// com.hdmallapp.thehyundai
// com.thehyundai.tohome
const googlePlay = await scrapingDetailGooglePlay('com.hdmallapp.thehyundai');
console.log(googlePlay);
