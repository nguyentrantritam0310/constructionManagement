import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import { saveAs } from 'file-saver'

/**
 * Format date to Vietnamese format (dd/mm/yyyy)
 */
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format currency to Vietnamese format
 */
const formatCurrency = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đồng'
}

/**
 * Get current date in Vietnamese format
 */
const getCurrentDate = () => {
  const today = new Date()
  return formatDate(today)
}

/**
 * Get day, month, year separately for template
 */
const getDateParts = (dateString) => {
  if (!dateString) return { day: '', month: '', year: '' }
  const date = new Date(dateString)
  return {
    day: String(date.getDate()).padStart(2, '0'),
    month: String(date.getMonth() + 1).padStart(2, '0'),
    year: date.getFullYear().toString()
  }
}

/**
 * Load template file from assets folder
 * Note: File must be in src/assets/ folder and be a valid .docx file
 */
const loadTemplate = async () => {
  try {
    // Load template from assets folder using Vite's asset handling
    // First try .docx, then fallback to .doc if needed
    let templateUrl
    let response
    
    try {
      // Try to import .docx file from assets using Vite's ?url suffix
      // This tells Vite to return the URL of the asset
      const templateModule = await import('../assets/mau-hop-dong-lao-dong-chung.docx?url')
      templateUrl = templateModule.default
      response = await fetch(templateUrl, { cache: 'no-cache' })
    } catch (importError) {
      console.warn('Could not import .docx with ?url, trying new URL method:', importError)
      try {
        // Fallback: Try using new URL
        templateUrl = new URL('../assets/mau-hop-dong-lao-dong-chung.docx', import.meta.url)
        response = await fetch(templateUrl.href, { cache: 'no-cache' })
      } catch (urlError) {
        console.warn('Could not load with new URL, trying public folder:', urlError)
        // Fallback: try loading from public folder
        response = await fetch('/mau-hop-dong-lao-dong-chung.docx', { cache: 'no-cache' })
      }
    }
    
    if (!response || !response.ok) {
      if (response?.status === 404 || !response) {
        throw new Error(
          'Không tìm thấy file mẫu hợp đồng.\n\n' +
          'Vui lòng:\n' +
          '1. Chuyển đổi file mau-hop-dong-lao-dong-chung.doc sang .docx\n' +
          '2. Đảm bảo file mau-hop-dong-lao-dong-chung.docx nằm trong thư mục src/assets/\n' +
          '3. Thêm các từ khóa placeholder như {tk_sohopdong}, {tk_nhanvien}, v.v. vào file Word'
        )
      }
      throw new Error(`Lỗi khi tải file template: ${response.status} ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    
    // Validate that it's not empty
    if (arrayBuffer.byteLength === 0) {
      throw new Error('File template rỗng hoặc không hợp lệ.')
    }
    
    // Validate that it's a valid zip file (docx is a zip file)
    // Check for ZIP file signature (PK header)
    const view = new Uint8Array(arrayBuffer.slice(0, 2))
    if (view[0] !== 0x50 || view[1] !== 0x4B) {
      throw new Error(
        'File không phải là file Word hợp lệ (.docx).\n\n' +
        'File .docx phải là định dạng ZIP. Vui lòng:\n' +
        '1. Mở file .doc bằng Microsoft Word\n' +
        '2. Chọn File > Save As\n' +
        '3. Chọn định dạng "Word Document (*.docx)"\n' +
        '4. Lưu file và đặt vào thư mục src/assets/'
      )
    }
    
    // Try to create a PizZip to validate it's a valid zip/docx
    try {
      const testZip = new PizZip(arrayBuffer)
      const files = Object.keys(testZip.files || {})
      if (files.length === 0) {
        throw new Error('File ZIP rỗng hoặc không hợp lệ.')
      }
      // Check if it has Word document structure
      const hasWordContent = files.some(f => 
        f.includes('word/') || f.includes('[Content_Types].xml') || f.includes('document.xml')
      )
      if (!hasWordContent) {
        throw new Error('File không phải là file Word (.docx) hợp lệ.')
      }
    } catch (zipError) {
      if (zipError.message.includes('end of central directory')) {
        throw new Error(
          'File không phải là file Word hợp lệ (.docx).\n\n' +
          'Có thể file là định dạng .doc (cũ) hoặc bị hỏng.\n' +
          'Vui lòng chuyển đổi file .doc sang .docx bằng Microsoft Word.'
        )
      }
      throw zipError
    }
    
    return arrayBuffer
  } catch (error) {
    console.error('Error loading template:', error)
    // Re-throw with more context if it's our custom error
    if (error.message.includes('Không tìm thấy') || 
        error.message.includes('không phải là file Word') ||
        error.message.includes('File không phải')) {
      throw error
    }
    throw new Error(
      'Không thể tải file mẫu hợp đồng.\n\n' +
      'Vui lòng kiểm tra:\n' +
      '1. File mau-hop-dong-lao-dong-chung.docx có trong thư mục src/assets/ không\n' +
      '2. File có đúng định dạng .docx (không phải .doc) không\n' +
      '3. File không bị hỏng\n\n' +
      `Chi tiết lỗi: ${error.message}`
    )
  }
}

/**
 * Format allowances text for template
 */
const formatAllowancesText = (allowances) => {
  if (!allowances || allowances.length === 0) {
    return 'Không có'
  }
  
  const validAllowances = allowances.filter(a => a && (a.value > 0 || a.Value > 0))
  if (validAllowances.length === 0) {
    return 'Không có'
  }
  
  return validAllowances.map(a => {
    const allowanceName = a.allowance?.allowanceName || a.allowanceName || a.AllowanceName || 'Phụ cấp'
    const value = a.value || a.Value || 0
    return `${allowanceName}: ${formatCurrency(value)}`
  }).join('\n')
}

/**
 * Get allowance value by name (case-insensitive partial match)
 */
const getAllowanceValueByName = (allowances, searchName) => {
  if (!allowances || allowances.length === 0) return 0
  
  const allowance = allowances.find(a => {
    if (!a) return false
    const allowanceName = (a.allowance?.allowanceName || a.allowanceName || a.AllowanceName || '').toLowerCase()
    const searchLower = searchName.toLowerCase()
    return allowanceName.includes(searchLower) || searchLower.includes(allowanceName)
  })
  
  if (!allowance) return 0
  return allowance.value || allowance.Value || 0
}

/**
 * Format allowance value for template (with "VNĐ/tháng" suffix if > 0)
 */
const formatAllowanceValue = (value) => {
  if (!value || value === 0) return ''
  return `${new Intl.NumberFormat('vi-VN').format(value)} VNĐ/tháng`
}

/**
 * Export labor contract to Word document using template
 * @param {Object} contract - Contract data
 * @param {Object} employee - Employee data
 */
export const exportLaborContract = async (contract, employee) => {
  try {
    // Load template
    const templateBuffer = await loadTemplate()
    
    // Validate buffer
    if (!templateBuffer || templateBuffer.byteLength === 0) {
      throw new Error('File template không hợp lệ hoặc rỗng.')
    }
    
    // Create zip from buffer
    let zip
    try {
      zip = new PizZip(templateBuffer)
    } catch (zipError) {
      console.error('Error creating PizZip:', zipError)
      throw new Error('File template không phải là file Word hợp lệ. Vui lòng đảm bảo file là định dạng .docx (không phải .doc).')
    }
    
    // Format employee name - ưu tiên employeeName, sau đó mới dùng firstName + lastName
    let employeeName = employee.employeeName || ''
    if (!employeeName && (employee.firstName || employee.lastName)) {
      employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim()
    }
    
    // Parse employeeName để lấy họ và tên riêng (nếu cần)
    let firstName = employee.firstName || ''
    let lastName = employee.lastName || ''
    if (!firstName && !lastName && employeeName) {
      // Tách tên từ employeeName (giả sử format: "Họ Tên Đệm Tên")
      const nameParts = employeeName.trim().split(/\s+/)
      if (nameParts.length > 1) {
        lastName = nameParts[0] // Họ
        firstName = nameParts.slice(1).join(' ') // Tên đệm + Tên
      } else {
        lastName = employeeName
      }
    }
    
    // Format dates
    const startDate = formatDate(contract.startDate)
    const endDate = contract.endDate ? formatDate(contract.endDate) : 'Không xác định'
    
    // Get date parts for template
    const startDateParts = getDateParts(contract.startDate)
    const endDateParts = contract.endDate ? getDateParts(contract.endDate) : { day: '', month: '', year: '' }
    const currentDateParts = getDateParts(new Date())
    
    // Format salaries
    const contractSalary = formatCurrency(contract.contractSalary)
    const insuranceSalary = formatCurrency(contract.insuranceSalary)
    
    // Format allowances
    const allowancesText = formatAllowancesText(contract.allowances)
    
    // Prepare data for template replacement
    // Mapping các từ khóa trong template với dữ liệu thực tế
    const templateData = {
      // Thông tin hợp đồng
      tk_sohopdong: contract.contractNumber || contract.constructionNumber || 'N/A',
      tk_loaihopdong: contract.contractTypeName || 'Hợp đồng lao động',
      
      // Thông tin nhân viên
      tk_nhanvien: employeeName || '[Tên nhân viên]',
      tk_honhanvien: firstName || '[Họ]',
      tk_tennhanvien: lastName || '[Tên]',
      tk_ngaysinh: formatDate(employee.birthday),
      tk_gioitinh: employee.gender === 'Male' ? 'Nam' : employee.gender === 'Female' ? 'Nữ' : 'Khác',
      tk_cmnd: employee.cmnd || employee.idCard || '[Số CMND/CCCD]',
      tk_noicap: employee.issuePlace || '[Nơi cấp]',
      tk_diachi: employee.address || '[Địa chỉ thường trú]',
      tk_sdt: employee.phone || '[Số điện thoại]',
      tk_email: employee.email || '[Email]',
      
      // Thông tin hợp đồng
      tk_ngaybatdau: startDate,
      tk_ngaybatdau_ngay: startDateParts.day,
      tk_ngaybatdau_thang: startDateParts.month,
      tk_ngaybatdau_nam: startDateParts.year,
      tk_ngayketthuc: endDate,
      tk_ngayketthuc_ngay: endDateParts.day,
      tk_ngayketthuc_thang: endDateParts.month,
      tk_ngayketthuc_nam: endDateParts.year,
      
      // Lương và phụ cấp
      tk_luonghopdong: contractSalary,
      tk_luonghopdong_so: new Intl.NumberFormat('vi-VN').format(contract.contractSalary || 0),
      tk_luongbaohiem: insuranceSalary,
      tk_luongbaohiem_so: new Intl.NumberFormat('vi-VN').format(contract.insuranceSalary || 0),
      tk_phucap: allowancesText,
      
      // Phụ cấp chi tiết (từng loại riêng)
      tk_phucap_antrua: formatAllowanceValue(getAllowanceValueByName(contract.allowances, 'ăn trưa')),
      tk_phucap_xangxe: formatAllowanceValue(getAllowanceValueByName(contract.allowances, 'xăng xe')),
      tk_phucap_dienthoai: formatAllowanceValue(getAllowanceValueByName(contract.allowances, 'điện thoại')),
      
      // Thông tin liên hệ nhân viên (thêm các biến thể)
      tk_email_nhanvien: employee.email || '[Email]',
      tk_sdt_nhanvien: employee.phone || '[Số điện thoại]',
      
      // Bộ phận và chức danh
      // Lấy từ roleName (ví dụ: "Nhân viên phòng Hành chính - Nhân sự" -> bộ phận là "Hành chính - Nhân sự")
      tk_bophancongtac: employee.department || employee.departmentName || contract.department || 
                        (employee.roleName && employee.roleName.includes('phòng') 
                          ? employee.roleName.split('phòng')[1]?.trim() || employee.roleName 
                          : employee.roleName) || '[Bộ phận công tác]',
      // Chức danh lấy từ roleName
      tk_chucdanh: employee.roleName || employee.position || employee.jobTitle || employee.positionName || 
                   contract.position || contract.jobTitle || contract.roleName || '[Chức danh chuyên môn]',
      
      // Ngày hiện tại
      tk_ngayhientai: formatDate(new Date()),
      tk_ngayhientai_ngay: currentDateParts.day,
      tk_ngayhientai_thang: currentDateParts.month,
      tk_ngayhientai_nam: currentDateParts.year,
      
      // Thông tin công ty (có thể cấu hình sau)
      tk_tencongty: '[Tên công ty]',
      tk_diachicongty: '[Địa chỉ công ty]',
      tk_sdtcongty: '[Số điện thoại công ty]',
      tk_vitricongviec: '[Vị trí công việc]',
    }

    // Replace placeholders in template
    console.log('Template data:', templateData)
    
    // Check if template uses placeholders with or without braces
    let usesBraces = false
    let needsManualReplace = false
    try {
      const documentXml = zip.files['word/document.xml']
      if (documentXml) {
        const xmlContent = documentXml.asText()
        // Check if placeholders have braces
        usesBraces = xmlContent.includes('{tk_') || xmlContent.includes('{tk ')
        // Check if there are placeholders without braces
        const hasPlaceholdersWithoutBraces = /tk_\w+/.test(xmlContent) && !usesBraces
        needsManualReplace = hasPlaceholdersWithoutBraces
        console.log('Template sử dụng placeholder có dấu ngoặc nhọn:', usesBraces)
        console.log('Cần thay thế thủ công:', needsManualReplace)
      }
    } catch (checkError) {
      console.warn('Không thể kiểm tra format placeholder:', checkError)
    }

    // Create docxtemplater instance
    let doc
    try {
      if (needsManualReplace) {
        // Template KHÔNG có dấu ngoặc nhọn: thực hiện manual replacement trong XML
        console.log('⚠️ Template không có dấu ngoặc nhọn, thực hiện thay thế thủ công...')
        
        const documentXml = zip.files['word/document.xml']
        if (documentXml) {
          let xmlContent = documentXml.asText()
          
          // Replace tất cả placeholder không có dấu ngoặc nhọn
          Object.keys(templateData).forEach(key => {
            const value = templateData[key] || ''
            const placeholderName = key.replace('tk_', '')
            
            // Escape XML special characters trong giá trị
            const escapedValue = String(value)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;')
            
            // Tạo patterns để tìm placeholder (có thể có khoảng trắng hoặc không)
            // Pattern 1: tk_sohopdong (không có khoảng trắng)
            // Pattern 2: tk sohopdong (có khoảng trắng)
            // Sử dụng word boundary để tránh thay thế nhầm
            const patterns = [
              // tk_placeholderName (không có khoảng, có dấu gạch dưới)
              new RegExp(`tk_${placeholderName}(?![a-zA-Z0-9_])`, 'g'),
              // tk placeholderName (có khoảng trắng)
              new RegExp(`tk\\s+${placeholderName}(?![a-zA-Z0-9_])`, 'g')
            ]
            
            patterns.forEach(pattern => {
              if (pattern.test(xmlContent)) {
                xmlContent = xmlContent.replace(pattern, escapedValue)
                console.log(`✅ Đã thay thế: ${key} = ${value}`)
              }
            })
          })
          
          // Update the XML in zip
          zip.file('word/document.xml', xmlContent)
          
          // Tạo lại zip với XML đã được cập nhật
          const updatedBuffer = zip.generate({ type: 'arraybuffer' })
          zip = new PizZip(updatedBuffer)
        }
      }
      
      // Tạo Docxtemplater instance (cho cả 2 trường hợp)
      doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
          start: '{',
          end: '}'
        },
        nullGetter: function(part) {
          return ''
        }
      })
      
      // Chỉ setData nếu template có dấu ngoặc nhọn
      if (usesBraces) {
        doc.setData(templateData)
      } else {
        // Đã replace thủ công, không cần setData
        doc.setData({})
      }
    } catch (docError) {
      console.error('Error creating Docxtemplater:', docError)
      throw new Error('Không thể xử lý file template. Vui lòng kiểm tra file template có đúng định dạng .docx không.')
    }

    try {
      // Render the document
      doc.render()
      
      // Debug: Check if any placeholders were not replaced
      const fullText = doc.getFullText()
      console.log('Document full text (first 1000 chars):', fullText.substring(0, 1000))
      
      // Check for unreplaced placeholders - try multiple patterns
      const patterns = [
        /\{tk_\w+\}/g,           // {tk_sohopdong}
        /\{tk\s+\w+\}/g,         // {tk sohopdong} (with spaces)
        /tk_\w+/g,               // tk_sohopdong (without braces)
        /tk\s+\w+/g              // tk sohopdong (with spaces, without braces)
      ]
      
      patterns.forEach((pattern, index) => {
        const unreplacedPlaceholders = fullText.match(pattern)
        if (unreplacedPlaceholders && unreplacedPlaceholders.length > 0) {
          console.warn(`⚠️ Các placeholder chưa được thay thế (pattern ${index + 1}):`, [...new Set(unreplacedPlaceholders)])
        }
      })
    } catch (error) {
      console.error('Error rendering template:', error)
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        properties: error.properties,
        stack: error.stack
      })
      
      if (error.properties && error.properties.errors instanceof Array) {
        const errorMessages = error.properties.errors
          .map(e => {
            const tag = e.tag || e.explanation || 'Unknown'
            return `${tag}: ${e.message || e.name || 'Error'}`
          })
          .join('\n')
        
        // Get all placeholders that caused errors
        const errorPlaceholders = error.properties.errors
          .map(e => e.tag || e.explanation)
          .filter(Boolean)
          .filter(tag => tag.startsWith('tk_'))
        
        let errorMsg = `Lỗi khi xử lý template:\n${errorMessages}`
        
        if (errorPlaceholders.length > 0) {
          errorMsg += `\n\nCác placeholder gây lỗi: ${errorPlaceholders.join(', ')}`
          errorMsg += `\n\nVui lòng kiểm tra trong file Word:\n`
          errorMsg += `1. Placeholder phải có dạng: {tk_tukhoa} (có dấu ngoặc nhọn)\n`
          errorMsg += `2. Placeholder phải là plain text (không được format bold/italic)\n`
          errorMsg += `3. Placeholder phải nằm trong cùng một đoạn văn (không bị ngắt dòng)\n`
          errorMsg += `4. Không có khoảng trắng thừa trong placeholder`
        }
        
        throw new Error(errorMsg)
      }
      
      // More detailed error message
      if (error.message && error.message.includes('Unclosed')) {
        throw new Error(
          'Lỗi: Có placeholder không đóng đúng trong file template.\n\n' +
          'Vui lòng kiểm tra:\n' +
          '1. Tất cả các placeholder phải có dạng: {tk_tukhoa} (có dấu ngoặc nhọn đầy đủ)\n' +
          '2. Không được có khoảng trắng giữa dấu ngoặc và từ khóa\n' +
          '3. Ví dụ đúng: {tk_sohopdong}\n' +
          '4. Ví dụ sai: { tk_sohopdong } hoặc {tk sohopdong}\n\n' +
          `Chi tiết: ${error.message}`
        )
      }
      
      throw error
    }

    // Generate blob
    const blob = doc.getZip().generate({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      compression: 'DEFLATE',
    })

    // Download file
    const fileName = `Hop_Dong_Lao_Dong_${contract.contractNumber || contract.id}_${employeeName.replace(/\s+/g, '_')}.docx`
    saveAs(blob, fileName)
    
    return true
  } catch (error) {
    console.error('Error exporting contract:', error)
    throw error
  }
}
