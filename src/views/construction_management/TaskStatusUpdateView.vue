<template>
  <div class="task-status-update">
    <h1 class="title">Cập nhật trạng thái nhiệm vụ thi công</h1>
    <div class="task-info">
      <p><strong>Tên nhiệm vụ:</strong> {{ task.name }}</p>
      <p><strong>Trạng thái hiện tại:</strong> <span class="status">{{ task.status }}</span></p>
    </div>

    <div class="status-update-form">
      <label for="newStatus">Chọn trạng thái mới:</label>
      <select id="newStatus" v-model="newStatus" class="status-select">
        <option v-for="status in validStatuses" :key="status" :value="status">
          {{ status }}
        </option>
      </select>
      <button @click="updateStatus" class="update-btn">Cập nhật trạng thái</button>
    </div>

    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-circle"></i> {{ error }}
    </div>
    <div v-if="success" class="success-message">
      <i class="fas fa-check-circle"></i> {{ success }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const task = ref({
  name: 'Đổ móng Block A',
  status: 'Đang thi công',
})

const validStatuses = ['Hoàn thành', 'Tạm dừng', 'Hủy bỏ']
const newStatus = ref('')
const error = ref('')
const success = ref('')

const updateStatus = () => {
  if (!validStatuses.includes(newStatus.value)) {
    error.value = 'Trạng thái không hợp lệ. Vui lòng chọn trạng thái hợp lệ.'
    success.value = ''
    return
  }

  // Giả lập cập nhật trạng thái vào cơ sở dữ liệu
  setTimeout(() => {
    task.value.status = newStatus.value
    success.value = 'Cập nhật trạng thái thành công!'
    error.value = ''
  }, 1000)
}
</script>

<style scoped>
.task-status-update {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  text-align: center;
}

.task-info {
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #495057;
}

.status {
  font-weight: bold;
  color: #3498db;
}

.status-update-form {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.status-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.update-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.update-btn:hover {
  background: #2980b9;
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(220, 53, 69, 0.1);
  border-radius: 8px;
}

.success-message {
  color: #28a745;
  text-align: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(40, 167, 69, 0.1);
  border-radius: 8px;
}
</style>
