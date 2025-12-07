<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import FormField from '@/components/common/FormField.vue'
import { LMap, LTileLayer, LMarker, LCircle } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Fix lỗi icon marker mặc định của Leaflet khi dùng với bundler như Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const props = defineProps({
  mode: { type: String, required: true, validator: v => ['create', 'update', 'detail'].includes(v) },
  attendancemachine: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  attendanceMachineName: '',
  longitude: '',
  latitude: '',
  allowedRadius: ''
})

// Regex patterns cho validation
const regexPatterns = {
  // Tên vị trí làm việc: chữ cái, số, khoảng trắng, dấu tiếng Việt, dấu gạch ngang và gạch dưới, độ dài 1-100
  attendanceMachineName: /^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_-]{1,100}$/,
  // Kinh độ: số thập phân, không giới hạn giá trị, tối đa 15 chữ số thập phân
  longitude: /^-?\d+(\.\d{1,15})?$/,
  // Vĩ độ: số thập phân, không giới hạn giá trị, tối đa 15 chữ số thập phân
  latitude: /^-?\d+(\.\d{1,15})?$/,
  // Bán kính: số dương, tối đa 10000 mét
  allowedRadius: /^\d+(\.\d{1,2})?$/
}

// Validation errors
const errors = ref({
  attendanceMachineName: '',
  longitude: '',
  latitude: '',
  allowedRadius: ''
})

// State cho bản đồ
const zoom = ref(13)
const mapCenter = ref([21.028511, 105.804817]) // Mặc định ở Hà Nội

const markerLatLng = computed(() => {
  const lat = parseFloat(formData.value.latitude)
  const lng = parseFloat(formData.value.longitude)
  if (!isNaN(lat) && !isNaN(lng)) {
    return [lat, lng]
  }
  return null
})

const circleData = computed(() => {
  return {
    latlng: markerLatLng.value,
    radius: parseFloat(formData.value.allowedRadius) || 0
  }
})

const initFormData = () => {
  if (props.mode === 'update' && props.attendancemachine) {
    formData.value.attendanceMachineName = props.attendancemachine.attendanceMachineName || ''
    formData.value.longitude = String(props.attendancemachine.longitude || '')
    formData.value.latitude = String(props.attendancemachine.latitude || '')
    formData.value.allowedRadius = String(props.attendancemachine.allowedRadius || '0')

    // Nếu có dữ liệu, canh giữa bản đồ vào vị trí đó
    const lat = parseFloat(props.attendancemachine.latitude)
    const lng = parseFloat(props.attendancemachine.longitude)
    if (!isNaN(lat) && !isNaN(lng)) {
      mapCenter.value = [lat, lng]
      zoom.value = 16 // Phóng to hơn cho điểm đã có
    }
  }
}

onMounted(async () => {
  initFormData()
})

watch(() => props.attendancemachine, (newAttendanceMachine) => {
  if (props.mode === 'update' && newAttendanceMachine) {
    initFormData()
  }
}, { immediate: true, deep: true })

// Cập nhật tâm bản đồ khi vị trí marker thay đổi
watch(markerLatLng, (newVal) => {
  if (newVal) {
    mapCenter.value = newVal
  }
})

const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        formData.value.latitude = position.coords.latitude.toFixed(6)
        formData.value.longitude = position.coords.longitude.toFixed(6)
        // Validate after getting location
        validateField('latitude')
        validateField('longitude')
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.");
      }
    );
  } else {
    alert("Trình duyệt của bạn không hỗ trợ Geolocation.");
  }
}

const handleMapClick = (event) => {
  if (props.mode === 'detail') return
  
  if (event && event.latlng) {
    formData.value.latitude = event.latlng.lat.toFixed(15)
    formData.value.longitude = event.latlng.lng.toFixed(15)
    // Validate after map click
    validateField('latitude')
    validateField('longitude')
  }
}

// Validation functions
const validateAttendanceMachineName = () => {
  const value = formData.value.attendanceMachineName?.trim()
  if (!value) {
    errors.value.attendanceMachineName = 'Tên vị trí làm việc không được để trống'
    return false
  }
  if (!regexPatterns.attendanceMachineName.test(value)) {
    errors.value.attendanceMachineName = 'Tên vị trí làm việc chỉ được chứa chữ cái, số, khoảng trắng, dấu tiếng Việt và các ký tự đặc biệt (gạch ngang, gạch dưới) (tối đa 100 ký tự)'
    return false
  }
  errors.value.attendanceMachineName = ''
  return true
}

const validateLongitude = () => {
  const value = formData.value.longitude?.trim()
  if (!value) {
    errors.value.longitude = 'Kinh độ không được để trống'
    return false
  }
  
  const longNum = parseFloat(value)
  if (isNaN(longNum)) {
    errors.value.longitude = 'Kinh độ phải là số'
    return false
  }
  
  if (!regexPatterns.longitude.test(value)) {
    errors.value.longitude = 'Định dạng kinh độ không hợp lệ (tối đa 15 chữ số thập phân)'
    return false
  }
  
  errors.value.longitude = ''
  return true
}

const validateLatitude = () => {
  const value = formData.value.latitude?.trim()
  if (!value) {
    errors.value.latitude = 'Vĩ độ không được để trống'
    return false
  }
  
  const latNum = parseFloat(value)
  if (isNaN(latNum)) {
    errors.value.latitude = 'Vĩ độ phải là số'
    return false
  }
  
  if (!regexPatterns.latitude.test(value)) {
    errors.value.latitude = 'Định dạng vĩ độ không hợp lệ (tối đa 15 chữ số thập phân)'
    return false
  }
  
  errors.value.latitude = ''
  return true
}

const validateAllowedRadius = () => {
  const value = formData.value.allowedRadius
  if (value === null || value === undefined || value === '') {
    errors.value.allowedRadius = 'Bán kính cho phép không được để trống'
    return false
  }
  
  const radiusNum = parseFloat(value)
  if (isNaN(radiusNum)) {
    errors.value.allowedRadius = 'Bán kính cho phép phải là số'
    return false
  }
  
  if (radiusNum < 0) {
    errors.value.allowedRadius = 'Bán kính cho phép không được âm'
    return false
  }
  
  if (radiusNum > 10000) {
    errors.value.allowedRadius = 'Bán kính cho phép không được vượt quá 10000 mét'
    return false
  }
  
  const valueStr = String(value)
  if (!regexPatterns.allowedRadius.test(valueStr)) {
    errors.value.allowedRadius = 'Bán kính cho phép không đúng định dạng'
    return false
  }
  
  // Validate decimal places
  const decimalPlaces = (valueStr.split('.')[1] || '').length
  if (decimalPlaces > 2) {
    errors.value.allowedRadius = 'Bán kính cho phép chỉ được có tối đa 2 chữ số thập phân'
    return false
  }
  
  errors.value.allowedRadius = ''
  return true
}

// Real-time validation cho các trường input
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'attendanceMachineName':
      validateAttendanceMachineName()
      break
    case 'longitude':
      validateLongitude()
      break
    case 'latitude':
      validateLatitude()
      break
    case 'allowedRadius':
      validateAllowedRadius()
      break
  }
}

// Validate toàn bộ form
const validateForm = () => {
  const validations = [
    validateAttendanceMachineName(),
    validateLongitude(),
    validateLatitude(),
    validateAllowedRadius()
  ]
  
  return validations.every(v => v === true)
}

const handleSubmit = () => {
  // Validate form trước khi submit
  if (!validateForm()) {
    // Scroll đến trường đầu tiên có lỗi
    const firstErrorField = document.querySelector('.is-invalid')
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      firstErrorField.focus()
    }
    return
  }
  
  // Backend yêu cầu longitude, latitude, allowedRadius là string
  const submitData = {
    attendanceMachineName: formData.value.attendanceMachineName.trim(),
    longitude: String(formData.value.longitude).trim(),
    latitude: String(formData.value.latitude).trim(),
    allowedRadius: String(formData.value.allowedRadius).trim()
  }
  
  // Thêm ID nếu là update mode
  if (props.mode === 'update' && props.attendancemachine) {
    submitData.ID = props.attendancemachine.id || props.attendancemachine.ID
  }
  
  emit('submit', submitData)
}

const handleClose = () => emit('close')
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-4 bg-white rounded shadow-sm">
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <label class="form-label">Tên vị trí làm việc <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.attendanceMachineName }"
          v-model="formData.attendanceMachineName"
          @blur="validateField('attendanceMachineName')"
          @input="validateField('attendanceMachineName')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          maxlength="100"
          placeholder="VD: Vị trí làm việc 01"
        />
        <div class="invalid-feedback">{{ errors.attendanceMachineName }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Kinh độ (Longitude) <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.longitude }"
          v-model="formData.longitude"
          @blur="validateField('longitude')"
          @input="validateField('longitude')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          placeholder="VD: 105.804817"
          step="0.000001"
        />
        <div class="invalid-feedback">{{ errors.longitude }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Vĩ độ (Latitude) <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.latitude }"
          v-model="formData.latitude"
          @blur="validateField('latitude')"
          @input="validateField('latitude')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          placeholder="VD: 21.028511"
          step="0.000001"
        />
        <div class="invalid-feedback">{{ errors.latitude }}</div>
      </div>
      <div class="col-md-6">
        <label class="form-label">Bán kính cho phép (m) <span class="text-danger">*</span></label>
        <input 
          type="text" 
          class="form-control" 
          :class="{ 'is-invalid': errors.allowedRadius }"
          v-model="formData.allowedRadius"
          @blur="validateField('allowedRadius')"
          @input="validateField('allowedRadius')"
          :disabled="props.mode === 'detail'"
          :readonly="props.mode === 'detail'"
          placeholder="VD: 100"
        />
        <div class="invalid-feedback">{{ errors.allowedRadius }}</div>
        <small class="form-text text-muted">Tối đa 10000 mét</small>
      </div>
      <div class="col-md-6">
        <label class="form-label d-block">&nbsp;</label>
        <button v-if="props.mode !== 'detail'" type="button" class="btn btn-outline-primary w-100 location-btn" @click="getCurrentLocation">
          <i class="fas fa-map-marker-alt me-2"></i> Lấy vị trí hiện tại
        </button>
      </div>
    </div>

    <div class="map-container mt-4">
      <h6 class="mb-2 text-muted">Hoặc chọn vị trí trên bản đồ</h6>
      <div style="height: 400px; width: 100%; border-radius: 8px; overflow: hidden;">
        <l-map ref="map" :zoom="zoom" :center="mapCenter" @click="handleMapClick">
          <l-tile-layer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base"
            name="OpenStreetMap" attribution="&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>">
          </l-tile-layer>
          <l-marker v-if="markerLatLng" :lat-lng="markerLatLng"></l-marker>
          <l-circle v-if="markerLatLng && circleData.radius > 0" :lat-lng="circleData.latlng"
            :radius="circleData.radius" :color="'#0d6efd'" :fillColor="'#0d6efd'" :fillOpacity="0.2" />
        </l-map>
      </div>
    </div>

    <div v-if="props.mode !== 'detail'" class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary btn-gradient">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới'
      }}</button>
    </div>
    <div v-else class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Đóng</button>
    </div>
  </form>
</template>

<style scoped>
.location-btn {
  height: calc(1.5em + 0.75rem + 2px); /* Match input height */
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-control {
  height: calc(1.5em + 0.75rem + 2px);
}

.form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.invalid-feedback {
  display: block;
  width: 100%;
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #dc3545;
}

.is-invalid {
  border-color: #dc3545;
  padding-right: calc(1.5em + 0.75rem);
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6 .4.4.4-.4m0 4.8-.4-.4-.4.4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right calc(0.375em + 0.1875rem) center;
  background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.btn-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.btn-gradient:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  color: white;
}
</style>
