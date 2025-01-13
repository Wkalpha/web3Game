// @ts-ignore
const createUserInfoTable = require('./tables/UserInfo');
const { createPrizePoolTable, insertInitialPrizePoolData } = require('./tables/PrizePool');
const createLeaderboardTable = require('./tables/Leaderboard');
const createLeaderboardBetRecordTable = require('./tables/LeaderboardBetRecord');
const createPrizeItemPoolTable = require('./tables/PrizeItemPool');
const createPrizeItemTable = require('./tables/PrizeItem');
const createUserDrawLogTable = require('./tables/UserDrawLog');
const createUserDrawCounterTable = require('./tables/UserDrawCounter');
const createUserInventoryTable = require('./tables/UserInventory');
const createResetLeftOfPlayDailyEvent = require('./events/ResetLeftOfPlayDaily');
const createGameInfoTable = require('./tables/GameInfo');
const createGameLogTable = require('./tables/GameLog');
const createGameLevel = require('./tables/GameLevel');
const createRewardLogTable = require('./tables/RewardLog');
const createBadgeDetailTable = require('./tables/BadgeDetail');
const createUserBadgeTable = require('./tables/UserBadge');
const createBadgeTransferLogTable = require('./tables/BadgeTransferLog');
const createDailyQuestsTable = require('./tables/DailyQuests');
const createUserDailyProgressTable = require('./tables/UserDailyProgress');

(async () => {
    try {
        await createUserInfoTable();
        await createPrizePoolTable();
        await insertInitialPrizePoolData();
        await createLeaderboardTable();
        await createLeaderboardBetRecordTable();
        await createPrizeItemPoolTable();
        await createPrizeItemTable();
        await createUserDrawLogTable();
        await createUserDrawCounterTable();
        await createUserInventoryTable();
        await createGameInfoTable();
        await createGameLogTable();
        await createGameLevel();
        await createResetLeftOfPlayDailyEvent();
        await createRewardLogTable();
        await createBadgeDetailTable();
        await createUserBadgeTable();
        await createBadgeTransferLogTable();
        await createDailyQuestsTable();
        await createUserDailyProgressTable();

        console.log('所有表、函數、事件初始化完成');
    } catch (err) {
        console.error('初始化失敗：', err);
    }
})();
