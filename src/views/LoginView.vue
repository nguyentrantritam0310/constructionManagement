<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-icon">
          <i class="fas fa-hard-hat"></i>
        </div>
        <h2>Đăng Nhập</h2>
        <p>Hệ thống quản lý thi công xây dựng</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">
            <i class="fas fa-user"></i>
            Tên đăng nhập
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            required
          >
        </div>

        <div class="form-group">
          <label for="password">
            <i class="fas fa-lock"></i>
            Mật khẩu
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="Nhập mật khẩu"
            required
          >
        </div>

        <div v-if="error" class="error-message">
          <i class="fas fa-exclamation-circle"></i>
          {{ error }}
        </div>

        <button type="submit" class="login-btn">
          <i class="fas fa-sign-in-alt"></i>
          Đăng nhập
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')

const handleLogin = () => {
  if (login(username.value, password.value)) {
    error.value = ''
  } else {
    error.value = 'Tên đăng nhập hoặc mật khẩu không đúng'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2c3e50, #3498db);
  padding: 1rem;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #3498db, #2c3e50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon i {
  font-size: 2.5rem;
  color: white;
}

.login-header h2 {
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.login-header p {
  color: #6c757d;
  margin: 0;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #495057;
  margin-bottom: 0.5rem;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: #2980b9;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem;
  }
}
</style>