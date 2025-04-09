<script setup>
import { ref } from 'vue'
import ActionButton from './ActionButton.vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  stats: {
    type: Array,
    default: () => []
  },
  createButtonText: {
    type: String,
    default: 'Thêm mới'
  },
  showCreateButton: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['search', 'create'])

const searchQuery = ref('')

const handleSearch = (event) => {
  emit('search', searchQuery.value)
}
</script>

<template>
  <div class="search-section mb-4">
    <div class="row align-items-center">
      <div class="col-md-6">
        <div class="d-flex justify-content-between align-items-center">
          <h1 class="h3 mb-0">{{ title }}</h1>
          <ActionButton
            v-if="showCreateButton"
            icon="fas fa-plus"
            type="primary"
            tooltip="Thêm mới"
            @click="$emit('create')"
          >
            <span class="ms-2">{{ createButtonText }}</span>
          </ActionButton>
        </div>
        <div class="search-box mt-3">
          <i class="fas fa-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            class="form-control search-input"
            placeholder="Tìm kiếm..."
            @input="handleSearch"
          >
        </div>
      </div>
      <div class="col-md-6">
        <div class="d-flex justify-content-end">
          <div class="stats-container">
            <span
              v-for="(stat, index) in stats"
              :key="index"
              class="stat-item"
            >
              <i :class="stat.icon + ' ' + stat.iconClass"></i>
              {{ stat.label }}: {{ stat.value }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-section {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.search-box {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  padding-left: 2.5rem;
  border-radius: 2rem;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}

.stats-container {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.stat-item i {
  font-size: 1rem;
}
</style>