const { getLeaderboard } = require('../models/leaderboardModel');

/**
 * 查看排行榜
 */
const queryLeaderboard = async (req, res) => {
  const { yearWeek } = req.body

  try {
    const leaderboardResults = await getLeaderboard(yearWeek);

    res.json({
      leaderboard: leaderboardResults
    });

  } catch (error) {
    res.status(500).json({ error: 'Bet fail', details: error.message });
  }
};

module.exports = {
  queryLeaderboard
};
