import './assets/main.css'
import './assets/tailwind.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ToastPlugin from 'vue-toast-notification';
import 'vue-toast-notification/dist/theme-bootstrap.css';

import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/authorizationStore'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ToastPlugin);
app.mount('#app')

const userStore = useUserStore();
userStore.login();


