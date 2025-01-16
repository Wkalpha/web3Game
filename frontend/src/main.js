import { createApp } from 'vue';
import App from './App.vue';
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

// 建立 Vue 應用
const app = createApp(App);

const options = {
    position: "top-center",
    timeout: 2970,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: true,
    closeButton: "button",
    icon: true,
    rtl: false
};
app.use(Toast, options);

// 掛載應用到指定的 DOM 節點
app.mount('#app');
