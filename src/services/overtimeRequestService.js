import api from '../api';

export const overtimeRequestService = {
  getAll: async () => {
    const response = await api.get('/EmployeeRequest/overtime');
    return response.data;
  },
  getById: async (voucherCode) => {
    const response = await api.get(`/EmployeeRequest/overtime/${voucherCode}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/EmployeeRequest/overtime', data);
    return response.data;
  },
  update: async (voucherCode, data) => {
    const response = await api.put(`/EmployeeRequest/overtime/${voucherCode}`, data);
    return response.data;
  },
  delete: async (voucherCode) => {
    const response = await api.delete(`/EmployeeRequest/overtime/${voucherCode}`);
    return response.data;
  }
};
