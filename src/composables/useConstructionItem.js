import { ref } from 'vue'
import { constructionItemService } from '../services/constructionItemService'
import { useGlobalMessage } from './useGlobalMessage'

export function useConstructionItem() {
    const loading = ref(false)
    const error = ref(null)
    const { showMessage } = useGlobalMessage()

    const createConstructionItem = async (constructionItem) => {
        loading.value = true
        error.value = null
        try {
            const result = await constructionItemService.create(constructionItem)
            showMessage('Thêm hạng mục thành công', 'success')
            return result
        } catch (err) {
            error.value = err.response?.data?.message || 'Có lỗi xảy ra khi thêm hạng mục'
            showMessage(error.value, 'error')
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateConstructionItem = async (id, constructionItem) => {
        loading.value = true
        error.value = null
        try {
            const result = await constructionItemService.update(id, constructionItem)
            showMessage('Cập nhật hạng mục thành công', 'success')
            return result
        } catch (err) {
            error.value = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hạng mục'
            showMessage(error.value, 'error')
            throw err
        } finally {
            loading.value = false
        }
    }

    const updateConstructionItemStatus = async (id, status) => {
        loading.value = true
        error.value = null
        try {
            const result = await constructionItemService.updateStatus(id, status)
            showMessage('Cập nhật trạng thái thành công', 'success')
            return result
        } catch (err) {
            error.value = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái'
            showMessage(error.value, 'error')
            throw err
        } finally {
            loading.value = false
        }
    }

    const deleteConstructionItem = async (id) => {
        loading.value = true
        error.value = null
        try {
            await constructionItemService.delete(id)
            showMessage('Xóa hạng mục thành công', 'success')
        } catch (err) {
            error.value = err.response?.data?.message || 'Có lỗi xảy ra khi xóa hạng mục'
            showMessage(error.value, 'error')
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        error,
        createConstructionItem,
        updateConstructionItem,
        updateConstructionItemStatus,
        deleteConstructionItem
    }
}
