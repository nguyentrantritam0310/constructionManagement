import axios from 'axios'

const API_URL = 'http://localhost:5244/api'
const CONSTRUCTION_ITEM_URL = `${API_URL}/ConstructionItem`

export const constructionItemService = {
    // Lấy chi tiết một hạng mục
    getById: async (id) => {
        const response = await axios.get(`${CONSTRUCTION_ITEM_URL}/${id}`)
        return response.data
    },

    // Lấy danh sách hạng mục theo công trình
    getByConstructionId: async (constructionId) => {
        const response = await axios.get(`${CONSTRUCTION_ITEM_URL}/construction/${constructionId}`)
        return response.data
    },

    // Tạo hạng mục mới
    create: async (constructionItem) => {
        const response = await axios.post(CONSTRUCTION_ITEM_URL, constructionItem)
        return response.data
    },

    // Cập nhật hạng mục
    update: async (id, constructionItem) => {
        const response = await axios.put(`${CONSTRUCTION_ITEM_URL}/${id}`, constructionItem)
        return response.data
    },

    // Cập nhật trạng thái
    updateStatus: async (id, status) => {
        const response = await axios.patch(`${CONSTRUCTION_ITEM_URL}/${id}/status`, { status })
        return response.data
    },

    // Xóa hạng mục
    delete: async (id) => {
        await axios.delete(`${CONSTRUCTION_ITEM_URL}/${id}`)
    }
}
