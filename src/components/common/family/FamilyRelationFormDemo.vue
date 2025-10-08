<template>
  <div class="container mt-4">
    <h3>Demo Family Relation Form</h3>
    <div class="row">
      <div class="col-md-8">
        <FamilyRelationForm
          :mode="mode"
          :familyRelation="selectedFamilyRelation"
          :employeeId="'employee-123'"
          :employeeName="'Nguyễn Văn A'"
          @submit="handleSubmit"
          @close="handleClose"
        />
      </div>
      <div class="col-md-4">
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
import FamilyRelationForm from './FamilyRelationForm.vue'

const mode = ref('create')
const selectedFamilyRelation = ref(null)

const handleSubmit = (data) => {
  console.log('Form submitted:', data)
  alert('Form submitted successfully! Check console for data.')
}

const handleClose = () => {
  console.log('Form closed')
}

const loadSampleData = () => {
  selectedFamilyRelation.value = {
    id: 1,
    relativeName: 'Trần Thị B',
    startDate: '2010-01-01',
    endDate: '2030-01-01',
    relationShipName: 'Vợ'
  }
  mode.value = 'update'
}

const clearData = () => {
  selectedFamilyRelation.value = null
  mode.value = 'create'
}
</script>
