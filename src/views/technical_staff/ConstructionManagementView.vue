<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useConstructionManagement } from '../../composables/useConstructionManagement'
import ConstructionList from '../../components/construction/ConstructionList.vue'
import { useFilter } from '../../composables/useFilter'
import StatusChangeDialog from '../../components/common/StatusChangeDialog.vue'
import ConstructionForm from '../../components/construction/ConstructionForm.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import { useGlobalMessage } from '../../composables/useGlobalMessage'

const { showMessage } = useGlobalMessage()

const {
  constructions,
  selectedConstruction,
  fetchConstructions,
  createConstruction,
  updateConstruction,
  updateConstructionStatus,
  fetchConstructionDetail
} = useConstructionManagement()


// Initialize filters
const statusFilter = ref('')
const dateRangeFilter = ref({
  start: null,
  end: null
})

// Use the filter composable with constructions
const {
  searchQuery,
  filteredItems: filteredConstructions,
  setSearchQuery,
  setFilter,
  clearFilters
} = useFilter(constructions, {
  defaultSortBy: 'startDate',
  defaultSortDirection: 'desc'
})

const showCreateDialog = ref(false)
const showUpdateDialog = ref(false)
const showStatusDialog = ref(false)

// Watch for filter changes
watch([statusFilter, dateRangeFilter], () => {
  let filtered = [...constructions.value]

  // Apply status filter
  if (statusFilter.value) {
    filtered = filtered.filter(construction => construction.status === statusFilter.value)
  }

  // Apply date range filter
  if (dateRangeFilter.value.start && dateRangeFilter.value.end) {
    const startDate = new Date(dateRangeFilter.value.start)
    const endDate = new Date(dateRangeFilter.value.end)
    endDate.setHours(23, 59, 59, 999) // Set to end of day

    filtered = filtered.filter(construction => {
      const constructionDate = new Date(construction.startDate)
      return constructionDate >= startDate && constructionDate <= endDate
    })
  }

  filteredConstructions.value = filtered
}, { deep: true })

const resetAllFilters = () => {
  statusFilter.value = ''
  dateRangeFilter.value = { start: null, end: null }
  clearFilters()
}

onMounted(async () => {
  try {
    await fetchConstructions()
  } catch (error) {
    console.error('Error fetching constructions:', error)
    showError('Không thể tải danh sách công trình')
  }
})

const handleUpdateConstructionStatus = async (data) => {
  try {
    await updateConstructionStatus(data.constructionId, data.newStatus)
    showSuccess('Cập nhật trạng thái thành công')
    await fetchConstructions() // Refresh the list after status change
    showStatusDialog.value = false
  } catch (err) {
    console.error('Error updating status:', err)
    showError('Không thể cập nhật trạng thái')
  }
}

const openCreateForm = () => {
  selectedConstruction.value = null
  showCreateDialog.value = true
}

const closeCreateForm = () => {
  showCreateDialog.value = false
}

const openUpdateForm = async (constructionId) => {
  try {
    const construction = await fetchConstructionDetail(constructionId)
    if (construction) {
      selectedConstruction.value = construction
      showUpdateDialog.value = true
    }
  } catch (error) {
    console.error('Error fetching construction details:', error)
    showError('Không thể tải thông tin công trình')
  }
}

const closeUpdateForm = () => {
  showUpdateDialog.value = false
}

const openStatusDialog = (construction) => {
  selectedConstruction.value = construction
  showStatusDialog.value = true
}

const handleCreateSubmit = async () => {
  try {
    await fetchConstructions() // Chỉ refresh danh sách sau khi tạo
    showCreateDialog.value = false
  } catch (err) {
    console.error('Error refreshing constructions:', err)
    showMessage('Không thể cập nhật danh sách công trình', 'error')
  }
}

const handleUpdateSubmit = async () => {
  try {
    await fetchConstructions() // Chỉ refresh danh sách sau khi cập nhật
    showUpdateDialog.value = false
    selectedConstruction.value = null
  } catch (err) {
    console.error('Error refreshing constructions:', err)
    showMessage('Không thể cập nhật danh sách công trình', 'error')
  }
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>Quản Lý Công Trình</h2>
      <button class="btn btn-primary" @click="openCreateForm">
        <i class="fas fa-plus me-2"></i>Thêm Công Trình
      </button>
    </div>

    <ConstructionList :constructions="filteredConstructions" @update-construction-status="openStatusDialog"
      @open-update-form="openUpdateForm" @refresh-constructions="fetchConstructions" />

    <!-- Create Dialog -->
    <ModalDialog v-model:show="showCreateDialog" title="Thêm Công Trình Mới" size="lg">
      <ConstructionForm mode="create" @close="handleCreateSubmit" />
    </ModalDialog>

    <!-- Update Dialog -->
    <ModalDialog v-model:show="showUpdateDialog" title="Cập Nhật Công Trình" size="lg">
      <ConstructionForm
        v-if="selectedConstruction"
        mode="update"
        :construction="selectedConstruction"
        @close="handleUpdateSubmit"
      />
    </ModalDialog>

    <!-- Status Change Dialog -->
    <StatusChangeDialog v-if="showStatusDialog && selectedConstruction" :show="showStatusDialog"
      :item="selectedConstruction" type="construction" title="Thay Đổi Trạng Thái Công Trình"
      @update:show="showStatusDialog = $event" @submit="handleUpdateConstructionStatus" />
  </div>
</template>

<style scoped>
.construction-management {
  padding: 1rem;
}
</style>
