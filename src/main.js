import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import '@fortawesome/fontawesome-free/css/all.min.css'
// Import Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { faUser, faCoffee } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

// Thêm icon vào thư viện
library.add(faUser, faCoffee);

const app = createApp(App)
app.use(router)
app.mount('#app')
