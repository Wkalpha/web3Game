const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    allowedHosts: "all", // 允許所有 Host
    host: "0.0.0.0", // 允許外部訪問
    port: 8080, // 與 ngrok 使用的端口一致
    hot: true, // 啟用 HMR
    liveReload: true // 啟用 Live Reload
  },
  pages: {
    index: {
      entry: 'src/main.js', // 項目的入口文件
      template: 'public/index.html', // 使用的模板
      filename: 'index.html', // 生成的文件
      title: 'TickTock Battle', // 這裡設置的 title 會替換 <%= htmlWebpackPlugin.options.title %>
    }
  }
})
