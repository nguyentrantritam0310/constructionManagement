import api from '../api'

export const importOrderService = {
    async create(data) {
        const response = await api.post('/ImportOrder', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    },
    async getByDirector(data) {
        const response = await api.get('/ImportOrder/director', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    },
    async updateStatus(id, status) {
        const response = await api.patch(
            `/ImportOrder/${id}/status`,
            { status: Number(status) },
            { headers: { 'Content-Type': 'application/json' } }
        )
        return response.data
    }
}