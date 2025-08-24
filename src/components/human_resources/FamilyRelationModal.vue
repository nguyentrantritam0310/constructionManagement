<script setup>
import { ref, computed, watch } from 'vue'
import DataTable from '../../components/common/DataTable.vue'

const props = defineProps({
  show: Boolean,
  employee: Object,
  relations: Array
})
const emit = defineEmits(['close', 'add', 'edit'])

const localRelations = ref([])
watch(() => props.relations, (val) => {
  localRelations.value = val ? [...val] : []
}, { immediate: true })

const handleClose = () => emit('close')
const handleAdd = () => emit('add', props.employee)
const handleEdit = (relation) => emit('edit', relation)
</script>

<template>
  <div v-if="show" class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">
        <div class="modal-header d-flex justify-content-between align-items-center" style="background:#1976d2;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
          <h5 class="mb-0" style="font-weight:600;font-size:20px;letter-spacing:1px;">
            <i class="fas fa-users me-2"></i> Quan hệ gia đình - {{ employee?.name || '' }}
          </h5>
          <button class="btn btn-light btn-circle" @click="handleClose" style="border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:18px;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body" style="padding:24px;">
          <DataTable
            :columns="[
              { key: 'relativeName', label: 'Tên người quan hệ' },
              { key: 'relation', label: 'Mối quan hệ' },
              { key: 'fromDate', label: 'Từ ngày' },
              { key: 'toDate', label: 'Đến ngày' },
              { key: 'actions', label: 'Thao tác' }
            ]"
            :data="localRelations"
          >
            <template #cell-actions="{ item }">
              <button class="btn btn-outline-primary btn-sm me-2" @click="handleEdit(item)">
                <i class="fas fa-edit me-1"></i> Sửa
              </button>
            </template>
          </DataTable>
        </div>
        <div class="modal-footer" style="padding:20px 24px;border-top:1px solid #eee;text-align:right;">
          <button class="btn btn-success" @click="handleAdd">
            <i class="fas fa-plus me-1"></i> Thêm quan hệ gia đình
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-wrapper {
  width: 100%;
  max-width: 600px;
}
.modal-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  padding: 0;
  overflow: hidden;
}
.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
}
.modal-body {
  padding: 16px 24px;
}
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  text-align: right;
}
</style>
