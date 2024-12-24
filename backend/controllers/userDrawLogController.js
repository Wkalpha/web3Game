const userDrawLogModel = require('../models/userDrawLogModel');

/**
 * 取得大獎Log
 */
const getBigPrizeLog = async (req, res) => {
  try {
    const bigPrizeResult = await userDrawLogModel.queryBigPrizeLog();
    res.json(bigPrizeResult);
    
  } catch (error) {
    res.status(500).json({ error: '查詢大獎紀錄失敗', details: error.message });
  }
};

module.exports = {
  getBigPrizeLog
};
