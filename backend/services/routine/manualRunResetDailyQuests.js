const resetDailyQuests = require('./resetDailyQuests');

resetDailyQuests().then(() => {
    console.log(`每日任務重置`);
    process.exit();
}).catch(err => {
    console.error(`❌ 每日任務重置失敗: ${err}`);
    process.exit(1);
});
