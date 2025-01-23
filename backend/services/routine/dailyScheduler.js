const cron = require('node-cron');
const resetDailyQuests = require('./resetDailyQuests');
const resetPlayOfTime = require('./resetPlayOfTime');

// 設定排程：每天凌晨 00:00 重置每日任務
cron.schedule('0 0 * * *', async () => {
    console.log("🔄 排程執行：每日重置...");
    await resetDailyQuests();
    await resetPlayOfTime();
    console.log("✅ 重置完成！");
}, {
    scheduled: true,
    timezone: "Asia/Taipei"
});