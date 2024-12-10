const WebSocket = require('ws');
const url = require('url'); // 解析 URL 查詢參數

class WebSocketService {
    constructor(port = 3001) {
        this.clients = new Map(); // 儲存 walletAddress -> WebSocket 的映射
        this.port = port;
        this.wss = null;
    }

    /**
     * 啟動 WebSocket 服務器
     */
    start() {
        this.wss = new WebSocket.Server({ port: this.port });

        this.wss.on('connection', (ws, request) => {
            // 1 獲取客戶端的錢包地址 (walletAddress)
            const queryParams = url.parse(request.url, true).query;
            const walletAddress = queryParams.walletAddress?.toLowerCase();

            if (!walletAddress) {
                console.log('無法識別客戶端，關閉 WebSocket 連線');
                ws.close();
                return;
            }

            // 如果該錢包地址已經連接，則關閉舊的 WebSocket 連接
            if (this.clients.has(walletAddress)) {
                const existingClient = this.clients.get(walletAddress);
                existingClient.terminate(); // 立即關閉舊的 WebSocket 連接
            }

            this.clients.set(walletAddress, ws);
            //   this.listConnectedClients();

            // 當 WebSocket 斷開連接時，從列表中移除客戶端
            ws.on('close', () => {
                console.log(`客戶端已斷開連接，walletAddress: ${walletAddress}`);
                this.clients.delete(walletAddress);
            });

            // 4 WebSocket 錯誤處理
            ws.on('error', (error) => {
                console.error(`WebSocket 錯誤：walletAddress: ${walletAddress}`, error);
            });
        });

        console.log(`WebSocket 服務已啟動，端口：${this.port}`);
    }

    /**
     * 向指定的 walletAddress 發送消息
     * @param {string} walletAddress - 要通知的客戶端的錢包地址
     * @param {object} message - 要發送的消息
     */
    broadcastToClient(walletAddress, message) {
        const ws = this.clients.get(walletAddress?.toLowerCase());
        if (ws && ws.readyState === WebSocket.OPEN) {
            console.log(`發送消息到 ${walletAddress}:`, message);
            ws.send(JSON.stringify(message));
        } else {
            console.log(`無法向 ${walletAddress} 發送消息，可能客戶端未連線`);
        }
    }

    /**
     * 向所有已連接的客戶端發送消息 (可選功能)
     * @param {object} message - 要發送的消息
     */
    broadcastToAll(message) {
        this.clients.forEach((ws, walletAddress) => {
            if (ws.readyState === WebSocket.OPEN) {
                console.log(`發送消息到 ${walletAddress}:`, message);
                ws.send(JSON.stringify(message));
            }
        });
    }

    /**
     * 列出當前連線的客戶端
     */
    listConnectedClients() {
        const connectedClients = Array.from(this.clients.keys());
        console.log('當前已連線的客戶端:', connectedClients);
    }
}

module.exports = WebSocketService;
