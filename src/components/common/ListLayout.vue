<script setup>
import { ref, computed } from 'vue'
import Pagination from './Pagination.vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

const currentPage = ref(1)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return props.items.slice(start, end)
})
</script>

<template>
  <div class="list-layout">
    <!-- Main content -->
    <slot :items="paginatedItems"></slot>

    <!-- Pagination -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedItems.length }} trên {{ items.length }} mục
      </div>
      <Pagination
        :total-items="items.length"
        :items-per-page="itemsPerPage"
        v-model:current-page="currentPage"
      />
    </div>
  </div>
</template>

<style scoped>
.list-layout {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>