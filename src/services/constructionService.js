import api from '../api'

export const constructionService = {
  // Lấy danh sách công trình
  async getAll() {
    const response = await api.get('/Constructions')
    return response.data
  },

  // Lấy chi tiết công trình
  async getById(id) {
    const response = await api.get(`/Constructions/${id}`)
    return response.data
  },

  // Tạo công trình mới (hỗ trợ upload file)
  async create(data) {
    const formData = new FormData()

    // Thêm các trường dữ liệu cơ bản
    formData.append('ConstructionTypeID', data.constructionTypeID)
    formData.append('ConstructionStatusID', data.constructionStatusID)
    formData.append('ConstructionName', data.constructionName)
    formData.append('Location', data.location)
    formData.append('TotalArea', data.totalArea)
    formData.append('StartDate', data.startDate)
    formData.append('ExpectedCompletionDate', data.expectedCompletionDate)

    // Thêm file thiết kế nếu có
    if (data.designBlueprint) {
      formData.append('DesignBlueprint', data.designBlueprint)
    }

    console.log('Sending form data:', {
      ConstructionTypeID: data.constructionTypeID,
      ConstructionStatusID: data.constructionStatusID,
      ConstructionName: data.constructionName,
      Location: data.location,
      TotalArea: data.totalArea,
      StartDate: data.startDate,
      ExpectedCompletionDate: data.expectedCompletionDate,
      hasDesignBlueprint: !!data.designBlueprint
    })

    const response = await api.post('/Constructions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    })
    return response.data
  },

  // Cập nhật công trình (hỗ trợ upload file)
  async update(id, data) {
    const formData = new FormData()

    // Thêm ID và các trường dữ liệu cơ bản
    formData.append('id', id)
    formData.append('constructionTypeID', data.constructionTypeID)
    formData.append('constructionName', data.constructionName)
    formData.append('location', data.location)
    formData.append('totalArea', data.totalArea)
    formData.append('startDate', data.startDate)
    formData.append('expectedCompletionDate', data.expectedCompletionDate)

    // Thêm danh sách hạng mục
    if (data.constructionItems) {
      formData.append('constructionItems', JSON.stringify(data.constructionItems))
    }

    // Thêm file thiết kế mới nếu có
    if (data.designBlueprint) {
      formData.append('designBlueprint', data.designBlueprint)
    }

    const response = await api.put(`/Constructions/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  // Cập nhật trạng thái công trình
  async updateStatus(id, newStatus) {
    const response = await api.patch(`/Constructions/${id}/status`, { status: newStatus })
    return response.data
  },

  // Xóa công trình
  async delete(id) {
    const response = await api.delete(`/Constructions/${id}`)
    return response.data
  },

  // Lấy danh sách hạng mục công trình
  async getItems(constructionId) {
    const response = await api.get(`/Constructions/${constructionId}/items`)
    return response.data
  }
}
