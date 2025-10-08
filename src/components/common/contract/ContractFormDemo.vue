<template>
  <div class="container mt-4">
    <h3>Demo Contract Form</h3>
    <div class="row">
      <div class="col-md-10">
        <ContractForm
          :mode="mode"
          :contract="selectedContract"
          :employees="employees"
          :contractTypes="contractTypes"
          :contractForms="contractForms"
          :allowances="allowances"
          @submit="handleSubmit"
          @close="handleClose"
        />
      </div>
      <div class="col-md-2">
        <div class="card">
          <div class="card-header">
            <h5>Test Controls</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Mode:</label>
              <select v-model="mode" class="form-select">
                <option value="create">Create</option>
                <option value="update">Update</option>
              </select>
            </div>
            <button @click="loadSampleData" class="btn btn-primary">Load Sample Data</button>
            <button @click="clearData" class="btn btn-secondary ms-2">Clear Data</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ContractForm from './ContractForm.vue'

const mode = ref('create')
const selectedContract = ref(null)

const employees = ref([
  { id: 'emp1', firstName: 'Nguyễn Văn', lastName: 'A', employeeCode: 'NV001' },
  { id: 'emp2', firstName: 'Trần Thị', lastName: 'B', employeeCode: 'NV002' }
])

const contractTypes = ref([
  { id: 1, contractTypeName: 'Hợp đồng chính thức' },
  { id: 2, contractTypeName: 'Hợp đồng thử việc' },
  { id: 3, contractTypeName: 'Hợp đồng khoán việc' }
])

const contractForms = ref([
  { id: 1, contractFormName: 'Chính thức' },
  { id: 2, contractFormName: 'Thử việc' },
  { id: 3, contractFormName: 'Khoán việc' }
])

const allowances = ref([
  { id: 1, allowanceName: 'Phụ cấp ăn trưa' },
  { id: 2, allowanceName: 'Phụ cấp xăng xe' },
  { id: 3, allowanceName: 'Phụ cấp điện thoại' }
])

const handleSubmit = (data) => {
  console.log('Form submitted:', data)
  alert('Form submitted successfully! Check console for data.')
}

const handleClose = () => {
  console.log('Form closed')
}

const loadSampleData = () => {
  selectedContract.value = {
    id: 1,
    contractNumber: 'HD001',
    contractTypeID: 1,
    contractFormID: 1,
    employeeID: 'emp1',
    status: 'Đã ký',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    contractSalary: 15000000,
    insuranceSalary: 14000000,
    approveStatus: 'Đã duyệt',
    allowances: [
      { allowanceID: 1, value: 500000 },
      { allowanceID: 2, value: 300000 }
    ]
  }
  mode.value = 'update'
}

const clearData = () => {
  selectedContract.value = null
  mode.value = 'create'
}
</script>

