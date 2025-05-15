import api from '../api'

export const materialExportOrderService = {
    async create(data) {
        const response = await api.post('/MaterialExportOrder', data, {
            headers: { 'Content-Type': 'application/json' }
        })
        return response.data
    }
}