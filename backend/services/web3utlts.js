// @ts-ignore
const dotenv = require('dotenv');
dotenv.config();

const { Web3 } = require('web3');

// Web3 和合約初始化
const INFURA_URL = 'wss://sepolia.infura.io/ws/v3/1eb05ea628ac4f55b5543cb60a084c43';
const web3 = new Web3(INFURA_URL);
const contractAddress = process.env.Web3ContractAddress;
const contractABI = require("../contract/time.json");

const contract = new web3.eth.Contract(contractABI, contractAddress);

// 請確保這些變數的值存儲在 .env 文件中，並且 .env 文件不會被上傳到公共 repo
const OWNER_PRIVATE_KEY = process.env.Web3PK; // 私鑰，必須保密
const OWNER_WALLET_ADDRESS = process.env.Web3OwnerWalletAddress; // 擁有者的錢包地址
async function transferEthToSpecificAddress(toAddress, amountInEther) {
    console.log("被呼叫", toAddress, amountInEther/10000)

    let ethToWei = amountInEther/10000;
    try {
        // 轉換金額為 wei
        const amountInWei = web3.utils.toWei(ethToWei.toString(), 'ether');

        // 生成交易數據
        const txData = contract.methods.transferEthToAddress(toAddress, amountInWei).encodeABI();

        // 取得目前的交易計數（nonce）
        const nonce = await web3.eth.getTransactionCount(OWNER_WALLET_ADDRESS, 'latest');

        // 構建交易對象
        const tx = {
            from: OWNER_WALLET_ADDRESS,
            to: contractAddress, // 呼叫合約
            gas: 2000000, // 確保 gas 夠用，通常可以調整小一點
            gasPrice: await web3.eth.getGasPrice(), // 取得當前網路的 gas 價格
            nonce: nonce, // 交易計數
            data: txData, // 呼叫 transferEthToAddress 函數
            value: '0' // 合約中的 transferEthToAddress 不需要額外的 ETH
        };

        // 使用私鑰簽署交易
        const signedTx = await web3.eth.accounts.signTransaction(tx, OWNER_PRIVATE_KEY);

        // 送出交易
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`交易成功，交易哈希: ${receipt.transactionHash}`);

    } catch (error) {
        console.error('轉移 ETH 失敗: ', error);
    }
}


// With draw
// **withdraw 函數：提取合約中的 ETH**
async function withdraw() {
    try {
        // 生成交易數據 (合約的 withdraw 函數無參數)
        const txData = contract.methods.withdraw().encodeABI();

        // 取得當前的 nonce
        const nonce = await web3.eth.getTransactionCount(OWNER_WALLET_ADDRESS, 'latest');

        // 構建交易對象
        const gasPrice = await web3.eth.getGasPrice();
        const tx = {
            from: OWNER_WALLET_ADDRESS,
            to: contractAddress,
            gas: 2000000,
            maxFeePerGas: gasPrice, // EIP-1559 使用 maxFeePerGas
            maxPriorityFeePerGas: web3.utils.toWei('2', 'gwei'), // 設置最大優先費用
            nonce: nonce,
            data: txData,
            value: '0'
        };

        // 使用私鑰簽署交易
        const signedTx = await web3.eth.accounts.signTransaction(tx, OWNER_PRIVATE_KEY);

        // 送出簽署的交易
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`提取交易成功，交易哈希: ${receipt.transactionHash}`);

        return receipt.transactionHash; // 返回交易哈希
    } catch (error) {
        console.error('提取合約內的 ETH 失敗: ', error);
        throw error; // 讓調用方知道失敗的原因
    }
}

// 測試區塊鏈連接
web3.eth.getBlockNumber()
    .then(blockNumber => console.log(`Current block number: ${blockNumber}`))
    .catch(error => console.error(`Error: ${error}`));

module.exports = {
    web3,
    withdraw,
    contract,
    transferEthToSpecificAddress
};