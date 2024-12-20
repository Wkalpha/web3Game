const { updateMainPrizePoolAmountAfterGameOver } = require('../models/prizePoolModel');
const { upsertLeaderboardAfterGameOver, getLeaderboard } = require('../models/leaderboardModel');
const { deductPlayTimes, updateUserTimeCoinAfterGameOver, getTimeCoin, deductTimeCoin, getTimeCoinPlayTimes } = require('../models/userModel');
const { insertWhenGetTargetTime, updateWhenStartTimer, updateWhenEndTimer, queryByGameIdAndRound } = require('../models/gameLogModel');
const { insertWhenGameStart, updateWhenGameOver } = require('../models/gameInfoModel');
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
    const { walletAddress, gameId, round } = req.body;
    const startTime = ((new Date().getTime() % 60000) / 1000).toFixed(2);

    try {
        // 儲存開始時間到數據庫
        await updateWhenStartTimer(startTime, gameId, round, walletAddress);
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
    const { walletAddress, gameId, round } = req.body;
    const endTime = ((new Date().getTime() % 60000) / 1000).toFixed(2);

    try {
        const startTime = await queryByGameIdAndRound(gameId, round);
        const elapsedTime = (parseFloat(endTime) - parseFloat(startTime)); // 秒數計算

        // 計算分差
        const scores = Math.max(1, Math.floor((1 - elapsedTime / 10) * 10));

        const roundData = await updateWhenEndTimer({ walletAddress, gameId, round, elapsedTime, scores });

        if (roundData.affectedRows === 0) {
            return res.status(404).json({ success: false, message: '更新失敗' });
        }

        res.json({ success: true, scores });
    } catch (err) {
        console.error('無法停止計時：', err);
        res.status(500).send('資料庫錯誤');
    }
};

/**
 * 遊戲結束
 */
const gameOver = async (req, res) => {
    const { message } = req.body;
    const parsedMessage = JSON.parse(message);
    const { walletAddress, gameResult, betAmount, odds, scores } = parsedMessage;

    try {
        const userTimeCoinOdds = gameResult === 'win' ? 1 + odds : 0;
        const prizePoolOdds = gameResult === 'lose' ? 1 : -odds;

        // 1. 更新玩家的餘額
        await updateUserTimeCoinAfterGameOver(walletAddress, betAmount, userTimeCoinOdds);

        // 2. 獲取玩家的餘額
        const userTimeCoin = await getTimeCoin(walletAddress);

        // 3. 更新主獎金池金額
        await updateMainPrizePoolAmountAfterGameOver(betAmount, prizePoolOdds);

        // 4. 插入或更新排行榜數據
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = Math.floor((currentDate - firstDayOfYear) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7); // 取得當前週數
        const yearWeek = `${year}${weekNumber.toString().padStart(2, '0')}`; // 例如：202450

        const winIncrement = gameResult === 'win' ? 1 : 0;
        const loseIncrement = gameResult === 'lose' ? 1 : 0;
        const scoreAdjustment = gameResult === 'win' ? scores : -scores;

        await upsertLeaderboardAfterGameOver(walletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment);

        // 5. 獲取排行榜數據
        const leaderboard = await getLeaderboard(yearWeek);

        res.json({
            userTimeCoin,
            leaderboard
        });
    } catch (err) {
        console.error('遊戲結束但發生錯誤', err);
        res.status(500).send('資料庫錯誤');
    }
};

module.exports = {
    gameStart,
    getTargetTime,
    startTimer,
    endTimer,
    gameOver
};
