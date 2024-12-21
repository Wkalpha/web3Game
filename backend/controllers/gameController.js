const { updateMainPrizePoolAmountAfterGameOver } = require('../models/prizePoolModel');
const { upsertLeaderboardAfterGameOver, getLeaderboard } = require('../models/leaderboardModel');
const { deductPlayTimes, updateUserTimeCoinAfterGameOver, getTimeCoin, deductTimeCoin, getTimeCoinPlayTimes } = require('../models/userModel');
const { insertWhenGetTargetTime, updateWhenStartTimer, updateWhenEndTimer, queryByGameIdAndRound, sumScoreByGameId } = require('../models/gameLogModel');
const { insertWhenGameStart, updateWhenGameOver, queryGameInfoByGameId } = require('../models/gameInfoModel');
const { v4: uuidv4 } = require('uuid');

/**
 * 開始遊戲
 */
const gameStart = async (req, res) => {
    const { walletAddress, level, odds, amountInput } = req.body;
    const gameId = uuidv4();
    try {
        // 1. 更新玩家的餘額
        await deductTimeCoin(walletAddress, amountInput);

        // 2. 扣除玩家遊戲次數
        await deductPlayTimes(walletAddress);

        // 3. 重查玩家餘額與次數回傳
        const userInfo = await getTimeCoinPlayTimes(walletAddress);

        // 4. 相關資訊寫入DB
        await insertWhenGameStart(walletAddress, gameId, level, odds, amountInput);

        res.json({
            gameId,
            leftOfPlay: userInfo?.LeftOfPlay,
            timeCoin: userInfo?.AdjustedTimeCoin
        });
    } catch (err) {
        console.error('無法開始遊戲：', err);
        res.status(500).send('資料庫錯誤');
    }
};

/**
 * 取得目標秒數
 */
const getTargetTime = async (req, res) => {
    const { gameId, walletAddress, round } = req.body;

    const targetTime = (Math.random() * 9 + 1).toFixed(2); // 1 到 10 秒的目標時間

    await insertWhenGetTargetTime(walletAddress, gameId, targetTime, round);

    res.json({ targetTime });
};

/**
 * 開始計時
 */
const startTimer = async (req, res) => {
    const { gameId, round } = req.body;
    const startTime = Date.now();

    try {
        // 儲存開始時間到數據庫
        await updateWhenStartTimer(gameId, startTime, round);
        res.json({ success: true });
    } catch (err) {
        console.error('無法開始計時：', err);
        res.status(500).send('資料庫錯誤');
    }
};

/**
 * 停止計時
 */
const endTimer = async (req, res) => {
    const { gameId, round } = req.body;
    const endTime = Date.now();

    try {
        const result = await queryByGameIdAndRound(gameId, round);

        const elapsedTime = (((endTime - result.StartTime) % 60000) / 1000).toFixed(2); // 經過秒數

        const difference = Math.abs(elapsedTime - result.TargetTime);

        // 計算分差
        const scores = Math.max(0, Math.floor((1 - difference / 10) * 10));

        const roundData = await updateWhenEndTimer(gameId, endTime, round, elapsedTime, scores);

        if (roundData.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '更新失敗' });
        }

        res.json({ success: true, scores, elapsedTime });
    } catch (err) {
        console.error('無法停止計時：', err);
        res.status(500).send('資料庫錯誤');
    }
};

/**
 * 遊戲結束
 */
const gameOver = async (req, res) => {
    const { gameId } = req.body;

    try {
        // 拿 gameId 去 GameLog 把 Score 加總後判斷勝負，門檻值要根據不同的難度有所高低
        const totalScore = await sumScoreByGameId(gameId);

        // GameInfo 找資訊
        const gameInfo = await queryGameInfoByGameId(gameId);

        // 判斷輸贏
        const gameResult = determineGameResult(totalScore, gameInfo.Level);
        
        const userTimeCoinOdds = gameResult.winOrLose === 'win' ? 1 + parseFloat(gameInfo.Odds) : 0;
        const prizePoolOdds = gameResult.winOrLose === 'lose' ? 1 : -parseFloat(gameInfo.Odds);

        // 1. 更新玩家的餘額
        await updateUserTimeCoinAfterGameOver(gameInfo.WalletAddress, gameInfo.BetAmount, userTimeCoinOdds);

        // 2. 獲取玩家的餘額
        const userTimeCoin = await getTimeCoin(gameInfo.WalletAddress);

        // 3. 更新主獎金池金額
        await updateMainPrizePoolAmountAfterGameOver(gameInfo.BetAmount, prizePoolOdds);

        // 4. 插入或更新排行榜數據
        const yearWeek = calculateYearWeek() // 例如：202450

        const winIncrement = gameResult.winOrLose === 'win' ? 1 : 0;
        const loseIncrement = gameResult.winOrLose === 'lose' ? 1 : 0;
        const scoreAdjustment = gameResult.winOrLose === 'win' ? gameResult.scoreAdjustment : -gameResult.scoreAdjustment;

        await upsertLeaderboardAfterGameOver(gameInfo.WalletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment);

        // 5. 獲取排行榜數據
        const leaderboard = await getLeaderboard(yearWeek);

        // 6. 更新 GameInfo
        const profit = gameInfo.BetAmount * userTimeCoinOdds;
        await updateWhenGameOver(gameId, gameResult.winOrLose, profit);

        res.json({
            userTimeCoin,
            leaderboard
        });
    } catch (err) {
        console.error('遊戲結束但發生錯誤', err);
        res.status(500).send('資料庫錯誤');
    }
};

/**
 * 取得當年的第幾星期 例如 2024/12/21 會回傳 202451
 * @returns 
 */
const calculateYearWeek = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 取得當前週數
    return `${year}${weekNumber.toString().padStart(2, '0')}`; // 例如：202450
};

/**
 * 傳入分數和難度，判斷輸贏並返回固定的分數調整
 * @param {Int} totalScores - 玩家總分
 * @param {String} level - 遊戲難度 (easy, normal, hard)
 * @returns {Object} 包含 GameResult 和 ScoreAdjustment 的物件
 */
const determineGameResult = (totalScores, level) => {
    const levelThreshold = {
        easy: 50,
        normal: 70,
        hard: 90
    };

    const scoreAdjustmentRules = {
        easy: { win: 1, lose: -1 },
        normal: { win: 3, lose: -3 },
        hard: { win: 5, lose: -5 }
    };

    // 判斷門檻值，默認值為 50
    const threshold = levelThreshold[level.toLowerCase()] || 50;

    // 判斷遊戲結果
    const winOrLose = totalScores >= threshold ? 'win' : 'lose';

    // 根據規則返回分數調整
    const scoreAdjustment = scoreAdjustmentRules[level.toLowerCase()]?.[winOrLose] || 0;

    return { winOrLose, scoreAdjustment };
};


module.exports = {
    gameStart,
    getTargetTime,
    startTimer,
    endTimer,
    gameOver
};
