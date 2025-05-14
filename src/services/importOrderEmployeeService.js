import api from '../api'

export const importOrderEmployeeService = {
    async create(data) {
        const response = await api.post('/ImportOrderEmployee', data, {
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return response.data
    }
}