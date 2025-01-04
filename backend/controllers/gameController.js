const prizePoolModel = require('../models/prizePoolModel');
const prizeItemModel = require('../models/prizeItemModel');
const leaderboardModel = require('../models/leaderboardModel');
const userModel = require('../models/userModel');
const gameLogModel = require('../models/gameLogModel');
const gameInfoModel = require('../models/gameInfoModel');
const userInventoryModel = require('../models/userInventoryModel');
const webSocketService = require('../services/webSocketService');
const gameLevelModel = require('../models/gameLevelModel');
const { v4: uuidv4 } = require('uuid');

/**
 * 開始遊戲
 */
const gameStart = async (req, res) => {
    const { walletAddress, level, amountInput, itemId } = req.body;
    const gameId = uuidv4();
    try {
        // 1. 更新玩家的餘額
        await userModel.deductTimeCoin(walletAddress, amountInput);

        // 2. 扣除玩家遊戲次數
        await userModel.deductPlayTimes(walletAddress);

        // 3. 重查玩家餘額與次數回傳
        const userInfo = await userModel.getTimeCoinPlayTimes(walletAddress);

        const gameLevelInfo = await gameInfoModel.getLevelInfo(level);

        let gameInfoInput = {
            addRewardMultiplier: 0,
            addDamageMultiplier: 0,
            round: gameLevelInfo.Round
        };

        // 4. 根據道具準備好遊戲
        // 檢查玩家是否有足夠道具
        let item = {};
        const userInventoryQuantity = await userInventoryModel.getUserInventoryCount(walletAddress, itemId);
        if (userInventoryQuantity > 0) {
            item = await prizeItemModel.getItemInfo(itemId);
            if (item) {
                switch (item.EffectType) {
                    case 'ExtendRound': {
                        gameInfoInput.round += item.EffectValue
                        break;
                    }
                    case 'FinalDamageBonus': {
                        gameInfoInput.addDamageMultiplier += item.EffectValue
                        break;
                    }
                    case 'RewardBonus': {
                        gameInfoInput.addRewardMultiplier += item.EffectValue
                        break;
                    }
                }
                // 扣除數量
                await userInventoryModel.decrementItemQuantity(userInfo.Id, itemId, 1);
            }
        }

        // 5. 相關資訊寫入DB
        await gameInfoModel.insertWhenGameStart({
            walletAddress,
            gameId,
            level,
            round: gameInfoInput.round,
            rewardMultiplier: gameInfoInput.addRewardMultiplier,
            damageMultiplier: gameInfoInput.addDamageMultiplier,
            itemId: item?.ItemId ?? null,
            odds: gameLevelInfo.RewardMultiplier,
            amountInput
        });

        // 6. 寫入log
        await gameLogModel.insertWhenGameStart({
            walletAddress: walletAddress,
            gameId: gameId,
            round: 1,
            itemId: item?.ItemId ?? null,
            itemType: item?.EffectType ?? null,
            itemEffectValue: item?.EffectValue ?? null,
            itemLeftRound: item?.EffectDurationRounds ?? null
        });

        res.json({
            gameRound: gameInfoInput.round,
            threshold: gameLevelInfo.Threshold,
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
    const { gameId, walletAddress } = req.body;

    const targetTime = (Math.random() * 9 + 1).toFixed(2); // 1 到 10 秒的目標時間

    const round = await gameLogModel.getGameLogCountByGameId(gameId);

    await gameLogModel.updateWhenGetTargetTime({ walletAddress: walletAddress, gameId: gameId, round: round, targetTime: targetTime });

    res.json({
        targetTime
    });
};

/**
 * 開始計時
 */
const startTimer = async (req, res) => {
    const { gameId } = req.body;
    const startTime = Date.now();

    try {
        const round = await gameLogModel.getGameLogCountByGameId(gameId);

        // 儲存開始時間到數據庫
        await gameLogModel.updateWhenStartTimer(gameId, startTime, round);

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
    const { gameId } = req.body;
    const endTime = Date.now();

    try {
        // 當前回合資訊
        const currentRoundInfo = await gameLogModel.queryByGameIdAndRound(gameId);

        if (!currentRoundInfo) {
            return res.status(404).json({ success: false, message: '遊戲記錄不存在' });
        }

        const elapsedTime = (((endTime - currentRoundInfo.StartTime) % 60000) / 1000).toFixed(2);
        const difference = Math.abs(elapsedTime - currentRoundInfo.TargetTime);

        // 取得 UserInfo 資訊
        const userInfo = await userModel.getBaseInfo(currentRoundInfo.WalletAddress);
        let scores = Math.max(0, Math.floor((1 - difference / 10) * 10)) * parseFloat(userInfo.BaseAttackPower);

        const gameInfo = await gameInfoModel.queryGameInfoByGameId(gameId);

        const item = await prizeItemModel.getItemInfo(gameInfo.ItemId);

        // 檢查道具影響
        if (gameInfo.ItemId && currentRoundInfo.ItemLeftRound > 0) {
            switch (item.EffectType) {
                case 'DamageBonus':
                    scores = Math.floor(scores * (1 + item.EffectValue));
                    break;
                case 'RandomScore':
                    scores += Math.floor(Math.random() * 5) + 1;
                    break;
                case 'AsignTime':
                    scores = 10;
                    break;
            }
        }

        scores = Math.round(scores);

        await gameLogModel.updateWhenEndTimer({ gameId: gameId, endTime: endTime, elapsedTime: elapsedTime, scores: scores });

        if (currentRoundInfo.currentRound == gameInfo.Round) {
            await gameOver(gameId);
        }

        return res.json({ success: true, scores, elapsedTime });

    } catch (err) {
        console.error('無法停止計時：', err);
        return res.status(500).json({ success: false, message: '資料庫錯誤' });
    }
};

/**
 * 遊戲結束
 */
const gameOver = async (gameId) => {

    try {
        // 拿 gameId 去 GameLog 把 Score 加總後判斷勝負，門檻值要根據不同的難度有所高低
        let totalScore = await gameLogModel.sumScoreByGameId(gameId);

        // 取得 GameInfo 資訊
        const gameInfo = await gameInfoModel.queryGameInfoByGameId(gameId);

        totalScore = Math.round(totalScore * (1 + parseFloat(gameInfo.DamageMultiplier)));

        // 取得 Game Level 資訊
        const gameLevelInfo = await gameLevelModel.queryGameLevel(gameInfo.Level);

        // 判斷輸贏
        const gameResult = determineGameResult(totalScore, gameLevelInfo.Threshold);

        let userTimeCoinOdds = gameResult.winOrLose === 'win' ? parseFloat(gameInfo.Odds) : 0;
        const prizePoolOdds = gameResult.winOrLose === 'lose' ? 1 : -parseFloat(gameInfo.Odds);

        // 取得 UserInfo 資訊
        const userInfo = await userModel.getBaseInfo(gameInfo.WalletAddress);

        userTimeCoinOdds = Math.round(userTimeCoinOdds * (1 + parseFloat(gameInfo.RewardMultiplier)) * parseFloat(userInfo.RewardMultiplier));

        // 1. 更新玩家的餘額
        await userModel.updateUserTimeCoinAfterGameOver(gameInfo.WalletAddress, gameInfo.BetAmount, userTimeCoinOdds);

        // 2. 獲取玩家的餘額
        const userTimeCoin = await userModel.getTimeCoin(gameInfo.WalletAddress);

        // 3. 更新主獎金池金額
        await prizePoolModel.updateMainPrizePoolAmountAfterGameOver(gameInfo.BetAmount, prizePoolOdds);

        // 4. 插入或更新排行榜數據
        const yearWeek = calculateYearWeek() // 例如：202450

        const winIncrement = gameResult.winOrLose === 'win' ? 1 : 0;
        const loseIncrement = gameResult.winOrLose === 'lose' ? 1 : 0;
        const scoreAdjustment = gameResult.winOrLose === 'win' ? gameLevelInfo.Score : -gameLevelInfo.Score;

        await leaderboardModel.upsertLeaderboardAfterGameOver(gameInfo.WalletAddress, yearWeek, winIncrement, loseIncrement, scoreAdjustment);

        // 5. 更新 GameInfo
        const profit = gameInfo.BetAmount * userTimeCoinOdds;
        await gameInfoModel.updateWhenGameOver(gameId, gameResult.winOrLose, profit, totalScore);

        // websocket
        const timeCoinChangeMessage = {
            event: 'TimeCoinChange',
            data: {
                walletAddress: gameInfo.WalletAddress,
                userTimeCoin: userTimeCoin
            }
        };

        const rewardAmount = parseFloat(gameInfo.BetAmount) * userTimeCoinOdds;
        const gameResultMessage = {
            event: 'GameResult',
            data: {
                walletAddress: gameInfo.WalletAddress,
                showText: gameResult.winOrLose === 'win'
                    ? `挑戰成功，您贏得了 ${rewardAmount} 顆 TimeCoin！`
                    : '挑戰失敗'
            }
        };

        webSocketService.sendToPlayerMessage(gameInfo.WalletAddress, timeCoinChangeMessage);
        webSocketService.sendToPlayerMessage(gameInfo.WalletAddress, gameResultMessage);

    } catch (err) {
        console.error('遊戲結束但發生錯誤', err);
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
 * @param {Int} threshold - 門檻值
 * @returns {Object} 包含 GameResult 物件
 */
const determineGameResult = (totalScores, threshold) => {
    // 判斷遊戲結果
    const winOrLose = totalScores >= threshold ? 'win' : 'lose';

    return { winOrLose };
};


module.exports = {
    gameStart,
    getTargetTime,
    startTimer,
    endTimer,
    gameOver
};
