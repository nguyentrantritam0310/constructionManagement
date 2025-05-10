<template>
  <div class="construction-management">
    <ConstructionList
      :constructions="constructions"
      @update-construction-status="handleConstructionStatusUpdate"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ConstructionList from '../components/construction/ConstructionList.vue'
import { constructionService } from '../services/constructionService'
import { useToast } from '../composables/useToast'

const { showSuccess, showError } = useToast()
const constructions = ref([])

const fetchConstructions = async () => {
  try {
    const response = await constructionService.getAll()
    constructions.value = response.data
  } catch (error) {
    console.error('Error fetching constructions:', error)
    showError('Không thể tải danh sách công trình')
  }
}

const handleConstructionStatusUpdate = async ({ constructionId, newStatus }) => {
  try {
    await constructionService.updateStatus(constructionId, newStatus)
    await fetchConstructions() // Refresh the list
    showSuccess('Cập nhật trạng thái thành công')
  } catch (error) {
    console.error('Error updating construction status:', error)
    showError('Không thể cập nhật trạng thái công trình')
  }
}

onMounted(() => {
  fetchConstructions()
})
</script>

<style scoped>
.construction-management {
  padding: 1rem;
}
</style>
