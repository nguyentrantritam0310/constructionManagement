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
  mode: { type: String, required: true, validator: v => ['create', 'update'].includes(v) },
  attendancemachine: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'submit'])

const formData = ref({
  attendanceMachineName: '',
  longitude: '',
  latitude: '',
  allowedRadius: 0
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
    formData.value.longitude = props.attendancemachine.longitude || ''
    formData.value.latitude = props.attendancemachine.latitude || ''
    formData.value.allowedRadius = props.attendancemachine.allowedRadius || 0

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
  if (event.latlng) {
    formData.value.latitude = event.latlng.lat.toFixed(6)
    formData.value.longitude = event.latlng.lng.toFixed(6)
  }
}

const handleSubmit = () => {
  emit('submit', formData.value)
}

const handleClose = () => emit('close')
</script>

<template>
  <form @submit.prevent="handleSubmit" class="p-4 bg-white rounded shadow-sm">
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <FormField label="Tên máy chấm công" type="text" v-model="formData.attendanceMachineName" required />
      </div>
      <div class="col-md-6">
        <FormField label="Kinh độ (Longitude)" type="text" v-model="formData.longitude" required />
      </div>
      <div class="col-md-6">
        <FormField label="Vĩ độ (Latitude)" type="text" v-model="formData.latitude" required />
      </div>
      <div class="col-md-6">
        <FormField label="Bán kính cho phép (m)" type="number" v-model="formData.allowedRadius" min="0" required />
      </div>
      <div class="col-md-6 d-flex align-items-end">
        <button type="button" class="btn btn-outline-primary w-100" @click="getCurrentLocation">
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

    <div class="mt-4 d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="handleClose">Hủy</button>
      <button type="submit" class="btn btn-primary btn-gradient">{{ props.mode === 'update' ? 'Cập nhật' : 'Tạo mới'
      }}</button>
    </div>
  </form>
</template>
