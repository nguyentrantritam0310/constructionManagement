<script setup>
import { ref, onMounted, computed } from 'vue'
import MaterialForm from '../../components/material/MaterialForm.vue'
import DataTable from '../../components/common/DataTable.vue'
import ModalDialog from '../../components/common/ModalDialog.vue'
import ActionButton from '../../components/common/ActionButton.vue'
import Pagination from '../../components/common/Pagination.vue'
import { useMaterialManagement } from '../../composables/useMaterialManagement'

const {
  materials,
  fetchMaterials,
  createMaterial,
  updateMaterial
} = useMaterialManagement()

const showFormDialog = ref(false)
const selectedMaterial = ref(null)
const formMode = ref('create') // 'create' or 'update'

const currentPage = ref(1)
const itemsPerPage = 5

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return materials.value.slice(start, end)
})

onMounted(() => {
  fetchMaterials()
})

const openForm = (mode, material = null) => {
  formMode.value = mode
  selectedMaterial.value = material ? { ...material } : null
  showFormDialog.value = true
}

const closeForm = () => {
  showFormDialog.value = false
  selectedMaterial.value = null
}

const handleSubmit = async (materialData) => {
  try {
    if (formMode.value === 'create') {
      await createMaterial(materialData)
      alert('Thêm vật tư thành công')
    } else if (formMode.value === 'update') {
      await updateMaterial(materialData.id, materialData)
      alert('Cập nhật vật tư thành công')
    }
    fetchMaterials() // Refresh the material list
    closeForm()
  } catch (error) {
    console.error('Error handling material:', error)
    alert('Có lỗi xảy ra khi xử lý vật tư')
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
}
</script>

<template>
  <div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0">Quản Lý Vật Tư</h1>
      <ActionButton icon="fas fa-plus" type="primary" tooltip="Thêm Vật Tư Mới" @click="openForm('create')">
        <span class="ms-2">Thêm</span>
      </ActionButton>
    </div>

    <!-- Danh sách vật tư -->
    <DataTable :columns="[
      { key: 'id', label: 'Mã Vật Tư' },
      { key: 'materialName', label: 'Tên Vật Tư' },
      { key: 'materialTypeName', label: 'Tên Loại Vật Tư' },

      { key: 'stockQuantity', label: 'Tồn Kho' },
      { key: 'unitPrice', label: 'Đơn Giá' }
    ]" :data="paginatedMaterials">
      <template #actions="{ item }">
        <div class="d-flex justify-content-center gap-2">
          <button class="btn btn-sm btn-primary" @click="openForm('update', item)">Sửa</button>
        </div>
      </template>
    </DataTable>

    <!-- Phân trang -->
    <div class="d-flex justify-content-between align-items-center mt-4">
      <div class="text-muted">
        Hiển thị {{ paginatedMaterials.length }} trên {{ materials.length }} vật tư
      </div>
      <Pagination
        :total-items="materials.length"
        :items-per-page="itemsPerPage"
        :current-page="currentPage"
        @update:currentPage="handlePageChange"
      />
    </div>

    <!-- Modal for Add/Edit Form -->
    <ModalDialog size="lg" v-model:show="showFormDialog" :title="formMode === 'create' ? 'Thêm Vật Tư' : 'Cập Nhật Vật Tư'">
      <MaterialForm
        :mode="formMode"
        :material="selectedMaterial"
        @submit="handleSubmit"
        @cancel="closeForm"
      />
    </ModalDialog>
  </div>
</template>

<style scoped>
.container-fluid {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
