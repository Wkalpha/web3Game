// @ts-ignore
const dotenv = require('dotenv');

dotenv.config();

const mysql = require('mysql2');

// 建立 MySQL 連接
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
});

// 設定 Web3 和合約資訊
const { Web3 } = require('web3');

// Infura 提供的 Sepolia 節點 URL（替換 YOUR_PROJECT_ID）
const INFURA_URL = 'wss://sepolia.infura.io/ws/v3/1eb05ea628ac4f55b5543cb60a084c43';

// 初始化 Web3
const web3 = new Web3(INFURA_URL);

// 測試連接
web3.eth.getBlockNumber()
    .then(blockNumber => console.log(`Current block number: ${blockNumber}`))
    .catch(error => console.error(`Error: ${error}`));
const contractAddress = "0x137D2bf0f51AC3956f0324E958221B252a2a8EFb"; // 智能合約地址
const contractABI = require("./contract/time.json"); // 載入合約的 ABI

const contract = new web3.eth.Contract(contractABI, contractAddress);

// 監聽購買代幣的事件
contract.events.TokensPurchased()
    .on('data', event => {
        console.log(event) // 可拔
        const weiToEth = web3.utils.fromWei(event.returnValues.ethAmount, 'ether');
        const timeCoin = weiToEth * 10000
        const buyer = event.returnValues.buyer;

        // 更新資料表中對應的 buyer 資料
        const updateUserTimeCoinSql = `
            UPDATE UserInfo
            SET TimeCoin = TimeCoin + ?
            WHERE WalletAddress = ?
        `;

        db.query(updateUserTimeCoinSql, [timeCoin, buyer], (err, result) => {
            if (err) {
                console.error('更新 UserInfo 失敗:', err);
            } else {
                console.log(`UserInfo 資料表已更新，受影響行數: ${result.affectedRows}`);
            }
        });

        // 更新 Prize Pool 資料
        const updatePrizePoolSql = `
            UPDATE PrizePool
            SET Amount = Amount + ?
            WHERE ID = 1
        `;

        db.query(updatePrizePoolSql, [weiToEth], (err, result) => {
            if (err) {
                console.error('更新 Prize Pool 失敗:', err);
            } else {
                console.log(`Prize Pool 資料表已更新，受影響行數: ${result.affectedRows}`);
            }
        });
    });

// 連接到資料庫
db.connect((err) => {
    console.log('連接PORT', process.env.DB_PORT)
    if (err) {
        console.error('MySQL 連線失敗：', err);
        process.exit(1);
    } else {
        console.log('MySQL 連線成功');

        // 創建 UserInfo 資料表
        const createUserInfoTable = `
      CREATE TABLE IF NOT EXISTS UserInfo (
        Id BIGINT PRIMARY KEY AUTO_INCREMENT,
        WalletAddress VARCHAR(255) NOT NULL,
        TimeCoin DOUBLE DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        Creator VARCHAR(255) NOT NULL
      )
    `;

        db.query(createUserInfoTable, (err, result) => {
            if (err) {
                console.error('建立 UserInfo 資料表失敗：', err);
            } else {
                console.log('UserInfo 資料表已確保存在');
            }
        });
    }
});

module.exports = db;
