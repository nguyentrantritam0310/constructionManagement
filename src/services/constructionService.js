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

    // Validate required fields
    if (!data.constructionTypeID || data.constructionTypeID <= 0) {
      throw new Error('Loại công trình không hợp lệ')
    }
    if (!data.constructionStatusID || data.constructionStatusID <= 0) {
      throw new Error('Trạng thái công trình không hợp lệ')
    }
    if (!data.constructionName || data.constructionName.trim() === '') {
      throw new Error('Tên công trình không được để trống')
    }
    if (!data.location || data.location.trim() === '') {
      throw new Error('Địa điểm không được để trống')
    }
    if (!data.totalArea || data.totalArea <= 0) {
      throw new Error('Diện tích phải lớn hơn 0')
    }
    if (!data.startDate) {
      throw new Error('Ngày bắt đầu không được để trống')
    }
    if (!data.expectedCompletionDate) {
      throw new Error('Ngày hoàn thành dự kiến không được để trống')
    }

    // Thêm các trường dữ liệu cơ bản - đảm bảo convert sang string cho FormData
    formData.append('ConstructionTypeID', String(data.constructionTypeID))
    formData.append('ConstructionStatusID', String(data.constructionStatusID))
    formData.append('ConstructionName', String(data.constructionName).trim())
    formData.append('Location', String(data.location).trim())
    formData.append('TotalArea', String(data.totalArea))
    
    // Format date - ASP.NET Core expects ISO 8601 format or specific format
    let startDate, expectedDate
    
    // Handle date input - could be string or Date object
    if (typeof data.startDate === 'string') {
      // If it's already a date string, try to parse it
      startDate = new Date(data.startDate)
    } else {
      startDate = data.startDate
    }
    
    if (typeof data.expectedCompletionDate === 'string') {
      expectedDate = new Date(data.expectedCompletionDate)
    } else {
      expectedDate = data.expectedCompletionDate
    }
    
    // Ensure they are Date objects
    if (!(startDate instanceof Date)) {
      startDate = new Date(startDate)
    }
    if (!(expectedDate instanceof Date)) {
      expectedDate = new Date(expectedDate)
    }
    
    if (isNaN(startDate.getTime())) {
      throw new Error('Ngày bắt đầu không hợp lệ')
    }
    if (isNaN(expectedDate.getTime())) {
      throw new Error('Ngày hoàn thành dự kiến không hợp lệ')
    }
    
    // Format as ISO 8601 string (ASP.NET Core can parse this from FormData)
    // Format: yyyy-MM-ddTHH:mm:ss.fffZ
    const startDateStr = startDate.toISOString()
    const expectedDateStr = expectedDate.toISOString()
    
    formData.append('StartDate', startDateStr)
    formData.append('ExpectedCompletionDate', expectedDateStr)

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
      StartDate: startDateStr,
      ExpectedCompletionDate: expectedDateStr,
      hasDesignBlueprint: !!data.designBlueprint
    })

    try {
      const response = await api.post('/Constructions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      // Log detailed error information
      console.error('Error creating construction:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        requestData: {
          ConstructionTypeID: data.constructionTypeID,
          ConstructionStatusID: data.constructionStatusID,
          ConstructionName: data.constructionName,
          Location: data.location,
          TotalArea: data.totalArea,
          StartDate: startDate.toISOString(),
          ExpectedCompletionDate: expectedDate.toISOString()
        }
      })
      
      // Log full response for debugging
      if (error.response?.data) {
        console.error('Backend error response:', JSON.stringify(error.response.data, null, 2))
      }
      
      // Extract error message from various possible locations
      let errorMessage = 'Không thể tạo công trình'
      
      if (error.response?.data) {
        // Try different possible error message fields
        errorMessage = error.response.data.message || 
                      error.response.data.title || 
                      error.response.data.error || 
                      (error.response.data.errors ? JSON.stringify(error.response.data.errors) : null) ||
                      errorMessage
      }
      
      if (!errorMessage || errorMessage === 'Không thể tạo công trình') {
        errorMessage = error.message || errorMessage
      }
      
      throw new Error(errorMessage)
    }
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
