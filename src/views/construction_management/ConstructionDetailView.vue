const currentPage = ref(1)
const itemsPerPage = 5

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return selectedConstruction.value?.constructionItems.slice(start, end) || []
})

const handlePageChange = (page) => {
  currentPage.value = page
}

<template>
  <!-- ... existing code ... -->

  <!-- Hạng mục thi công -->
  <div v-show="activeTab === 'items'" class="fade-in">
    <div class="table-toolbar mb-3">
      <h2 class="section-title">
        <i class="fas fa-list me-2"></i>
        Danh sách hạng mục
      </h2>
    </div>
    <DataTable :columns="constructionItemColumns" :data="paginatedItems"
      @row-click="handleItemClick" class="custom-table">
      <!-- ... existing code ... -->
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedItems.length }} trên {{ selectedConstruction?.constructionItems.length || 0 }} hạng mục
      </div>
      <Pagination
        :total-items="selectedConstruction?.constructionItems.length || 0"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>
  </div>
  <!-- ... existing code ... -->
</template>
