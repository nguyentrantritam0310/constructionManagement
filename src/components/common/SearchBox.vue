<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Tìm kiếm...'
  }
})

const emit = defineEmits(['search'])

const searchQuery = ref('')

// Debounce search to avoid too many emissions
let timeout = null
watch(searchQuery, (newValue) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    emit('search', newValue)
  }, 300)
})
</script>

<template>
  <div class="search-box">
    <div class="input-group">
      <span class="input-group-text bg-white border-end-0">
        <i class="fas fa-search text-muted"></i>
      </span>
      <input
        type="text"
        v-model="searchQuery"
        class="form-control border-start-0 ps-0"
        :placeholder="placeholder"
      >
    </div>
  </div>
</template>

<style scoped>
.search-box {
  max-width: 300px;
}

.input-group {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.input-group-text {
  border-radius: 8px 0 0 8px;
}

.form-control {
  border-radius: 0 8px 8px 0;
}

.form-control:focus {
  box-shadow: none;
  border-color: #dee2e6;
}

.input-group:focus-within {
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,0.25);
}
</style>