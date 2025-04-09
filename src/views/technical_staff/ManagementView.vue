<script setup>
import { ref, computed } from 'vue'
import DataList from '../../components/common/DataList.vue'
import CreateDialog from '../../components/common/CreateDialog.vue'
import UpdateDialog from '../../components/common/UpdateDialog.vue'

const props = defineProps({
  type: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
})

const showCreateDialog = ref(false)
const showUpdateDialog = ref(false)
const selectedItem = ref(null)

// Column definitions based on type
const columns = computed(() => {
  if (props.type === 'project') {
    return [
      { key: 'projectCode', label: 'Mã Dự Án' },
      { key: 'projectName', label: 'Tên Dự Án' },
      { key: 'startDate', label: 'Ngày Bắt Đầu' },
      { key: 'endDate', label: 'Ngày Kết Thúc' },
      { key: 'status', label: 'Trạng Thái' }
    ]
  } else if (props.type === 'construction-plan') {
    return [
      { key: 'planId', label: 'Mã Kế Hoạch' },
      { key: 'planName', label: 'Tên Kế Hoạch' },
      { key: 'projectCode', label: 'Mã Dự Án' },
      { key: 'itemCode', label: 'Mã Hạng Mục' },
      { key: 'supervisor', label: 'Người Phụ Trách' },
      { key: 'startDate', label: 'Ngày Bắt Đầu' },
      { key: 'endDate', label: 'Ngày Kết Thúc' },
      { key: 'status', label: 'Trạng Thái' }
    ]
  }
  return []
})

// Button text based on type
const createButtonText = computed(() => {
  return props.type === 'project' ? 'Thêm Dự Án' : 'Tạo Kế Hoạch'
})

const handleCreate = (newItem) => {
  console.log(`Creating new ${props.type}:`, newItem)
  showCreateDialog.value = false
}

const handleUpdate = (updatedItem) => {
  console.log(`Updating ${props.type}:`, updatedItem)
  showUpdateDialog.value = false
}

const openUpdateDialog = (item) => {
  selectedItem.value = item
  showUpdateDialog.value = true
}
</script>

<template>
  <div class="management-view">
    <div class="page-header">
      <h1>{{ title }}</h1>
      <button class="btn-create" @click="showCreateDialog = true">
        <i class="fas fa-plus"></i>
        <span>{{ createButtonText }}</span>
      </button>
    </div>

    <DataList 
      :columns="columns"
      :type="type"
      @update-item="openUpdateDialog"
    />

    <CreateDialog
      v-model:show="showCreateDialog"
      :type="type"
      @submit="handleCreate"
    />

    <UpdateDialog
      v-if="selectedItem"
      v-model:show="showUpdateDialog"
      :type="type"
      :item="selectedItem"
      @submit="handleUpdate"
    />
  </div>
</template>

<style scoped>
.management-view {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  animation: fadeIn 0.5s ease-in-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: slideDown 0.5s ease-in-out;
}

h1 {
  color: #2c3e50;
  margin: 0;
  position: relative;
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: #3498db;
    transition: width 0.3s ease;
  }
  &:hover:after {
    width: 100%;
  }
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #2980b9;
    transform: translateY(-1px);
    i {
      transform: rotate(90deg);
    }
  }

  i {
    transition: transform 0.3s ease;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style> 