const leaderboardModel = require('../models/leaderboardModel');

/**
 * 查看排行榜
 */
const queryLeaderboard = async (req, res) => {
  const { yearWeek } = req.body

  try {
    const leaderboardResults = await leaderboardModel.getLeaderboard(yearWeek);

    res.json({
      leaderboard: leaderboardResults
    });

  } catch (error) {
    res.status(500).json({ error: '取得排行榜失敗', details: error.message });
  }
};

module.exports = {
  queryLeaderboard
};
