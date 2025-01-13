const cron = require('node-cron');
const resetDailyQuests = require('./resetDailyQuests');

// 設定排程：每天凌晨 00:00 重置每日任務
cron.schedule('0 0 * * *', async () => {
    console.log("🔄 排程執行：重置每日任務...");
    await resetDailyQuests();
    console.log("✅ 每日任務重置完成！");
}, {
    scheduled: true,
    timezone: "Asia/Taipei"
});