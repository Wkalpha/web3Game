啟動排程
pm2 start leaderboardScheduler.js --name leaderboard-scheduler
leaderboardScheduler.js>要跑的程式
--name abc>幫排程取個名字

查看目前有的排程
pm2 list

排程跑的狀況
pm2 logs

伺服器重啟之後要重新啟動
pm2 save
pm2 startup

更新排程
pm2 restart leaderboard-scheduler

停止排程
pm2 stop leaderboard-scheduler

砍掉排程
pm2 delete leaderboard-scheduler