const { queryPrizeItem } = require('../models/prizeItemModel');

/**
 * 取得抽獎池
 */
const getPrizeItem = async (req, res) => {
  const { poolName } = req.body;
  try {
    const prizeItems = await queryPrizeItem(poolName);

    res.json({
      prizeItems
    });

  } catch (error) {
    res.status(500).json({ error: '取得獎品失敗', details: error.message });
  }
};

module.exports = {
  getPrizeItem
};
