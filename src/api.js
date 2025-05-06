import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5244/api', // đổi đúng port backend của bạn
});


export default api;