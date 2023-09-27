import List from '../../models/list.js';

/* 상세 조회
GET /api/detail/name/os?
GET /api/detail/thehyundai/googlePlay
GET /api/detail/thehyundai/appStore
*/
export const read = async (req, res) => {
  const { name, os } = req.params;

  try {
    const queryResult = await List.findOne({ name }).exec();
    if (!queryResult) {
      return res.status(404);
    }
    if (os) {
      return res.json(queryResult[os]);
    }
    return res.json(queryResult);
  } catch (e) {
    return res.status(500).json(e);
  }
};
