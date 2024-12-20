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
const createUpdateTop3RanksFunction = require('./functions/UpdateTop3Ranks');
const createResetLeftOfPlayDailyEvent = require('./events/ResetLeftOfPlayDaily');
const createUpdateLeaderboardWeeklyEvent = require('./events/UpdateLeaderboardWeekly');
const createGameInfoTable = require('./tables/GameInfo');
const createGameLogTable = require('./tables/GameLog');

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
        await createUpdateTop3RanksFunction();
        await createResetLeftOfPlayDailyEvent();
        await createUpdateLeaderboardWeeklyEvent();

        console.log('所有表、函數、事件初始化完成');
    } catch (err) {
        console.error('初始化失敗：', err);
    }
})();
