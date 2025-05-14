import api from '../api'

export const importOrderService = {
    async create(data) {
        const response = await api.post('/ImportOrder', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    }
}