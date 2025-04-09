<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalItems: {
    type: Number,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 5
  },
  currentPage: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:currentPage'])

const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage)
})

const pages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

const handlePageClick = (page) => {
  if (page !== '...' && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div class="pagination">
    <button
      class="pagination-btn"
      :disabled="currentPage === 1"
      @click="handlePageChange(currentPage - 1)"
    >
      Trước
    </button>

    <div class="page-numbers">
      <button
        v-for="page in pages"
        :key="page"
        class="pagination-btn"
        :class="{ active: page === currentPage }"
        @click="handlePageChange(page)"
      >
        {{ page }}
      </button>
    </div>

    <button
      class="pagination-btn"
      :disabled="currentPage === totalPages"
      @click="handlePageChange(currentPage + 1)"
    >
      Sau
    </button>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #3498db;
  background: white;
  color: #3498db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #3498db;
  color: white;
}

.pagination-btn.active {
  background: #3498db;
  color: white;
}

.pagination-btn:disabled {
  border-color: #bdc3c7;
  color: #bdc3c7;
  cursor: not-allowed;
}
</style>
