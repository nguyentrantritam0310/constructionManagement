<template>
  <div class="weather-forecast-container">
    <div class="location-select" data-tour="location-select">
      <div class="location-header">
        <h4 data-tour="title"><i class="fas fa-map-marker-alt me-2"></i> Chọn vị trí để dự báo thời tiết</h4>
      </div>
      <div class="location-content">
        <div class="location-info">
          <div class="info-item">
            <label>Vĩ độ:</label>
            <span>{{ selectedLatitude.toFixed(6) }}</span>
          </div>
          <div class="info-item">
            <label>Kinh độ:</label>
            <span>{{ selectedLongitude.toFixed(6) }}</span>
          </div>
          <button class="btn btn-primary" @click="fetchForecast" :disabled="loading" data-tour="fetch-button">
            <i class="fas fa-cloud-sun me-2"></i>Lấy dự báo cho vị trí này
          </button>
          <button class="btn btn-outline-secondary" @click="getCurrentLocation">
            <i class="fas fa-crosshairs me-2"></i>Lấy vị trí hiện tại
          </button>
        </div>
        <div class="map-container">
          <!-- Search Box -->
          <div class="search-box">
            <div class="search-input-wrapper">
              <i class="fas fa-search search-icon"></i>
              <input 
                type="text" 
                v-model="searchQuery"
                @input="handleSearchInput"
                @keyup.enter="performSearch"
                placeholder="Tìm kiếm địa điểm (ví dụ: Hà Nội, TP.HCM, Đà Nẵng...)"
                class="search-input"
              />
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                class="clear-search-btn"
                title="Xóa">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <!-- Search Results Dropdown -->
            <div v-if="searchResults.length > 0" class="search-results">
              <div 
                v-for="(result, index) in searchResults" 
                :key="index"
                @click="selectSearchResult(result)"
                class="search-result-item">
                <i class="fas fa-map-marker-alt"></i>
                <div class="result-info">
                  <div class="result-name">{{ result.display_name }}</div>
                  <div class="result-type">{{ result.type }}</div>
                </div>
              </div>
            </div>
            <div v-if="searching" class="search-loading">
              <i class="fas fa-spinner fa-spin"></i> Đang tìm kiếm...
            </div>
          </div>
          <div class="map-wrapper" data-tour="map">
            <l-map 
              ref="map" 
              :zoom="zoom" 
              :center="mapCenter" 
              @click="handleMapClick">
              <l-tile-layer 
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
                layer-type="base"
                name="CartoDB Voyager (No Labels)"
                attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>"
                subdomains="abcd"
                max-zoom="19">
              </l-tile-layer>
              <l-marker v-if="markerLatLng" :lat-lng="markerLatLng"></l-marker>
            </l-map>
          </div>
          <p class="map-hint"><i class="fas fa-info-circle me-2"></i>Click trên bản đồ hoặc tìm kiếm để chọn vị trí</p>
        </div>
      </div>
    </div>

    <div class="weather-forecast-view">
      <h2 class="title">
        <i class="fas fa-cloud-sun"></i>
        Dự báo thời tiết 7 ngày tới
      </h2>

      <div class="forecast-content">
        <div v-if="loading" class="loading-container">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
          <p class="loading-text">Đang tải dự báo thời tiết...</p>
        </div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else>
          <div class="forecast-grid" data-tour="forecast-grid">
            <div v-for="(day, idx) in roundedForecast" :key="day.date" class="forecast-card">
              <div class="card-header">
                <i class="fas fa-calendar-day"></i> <b>{{ day.date }}</b>
              </div>
              <div class="card-body">
                <div class="card-row"><i class="fas fa-temperature-high temp-high"></i> <span class="label">Nhiệt độ cao
                    nhất:</span> <span class="value">{{ formatNumber(day.tmax) }}°C</span></div>
                <div class="card-row"><i class="fas fa-temperature-low temp-low"></i> <span class="label">Nhiệt độ thấp
                    nhất:</span> <span class="value">{{ formatNumber(day.tmin) }}°C</span></div>
                <div class="card-row"><i class="fas fa-cloud-rain rain"></i> <span class="label">Lượng mưa:</span> <span
                    class="value">{{ formatNumber(day.prcp) }} mm</span></div>
                <div class="card-row"><i class="fas fa-sun sun"></i> <span class="label">Giờ nắng:</span> <span
                    class="value">{{ formatNumber(day.sunshine_duration) }} h</span></div>
                <div class="card-row"><i class="fas fa-wind wind"></i> <span class="label">Tốc độ gió lớn nhất:</span> <span
                    class="value">{{ formatNumber(day.wind_speed_max) }} km/h</span></div>
                <div class="card-row"><i class="fas fa-bolt"></i> <span class="label">Tổng bức xạ:</span> <span
                    class="value">{{ formatNumber(day.radiation_sum) }} W/m²</span></div>
                <button class="detail-btn" @click="toggleDetail(idx)">
                  <span v-if="detailOpen === idx">Ẩn chi tiết</span>
                  <span v-else>Xem chi tiết</span>
                </button>
                <transition name="fade">
                  <div v-if="detailOpen === idx" class="detail-panel">
                    <div class="detail-grid">
                      <div class="detail-item"><i class="fas fa-thermometer-half"></i> Cảm nhận max: <b>{{
                        formatNumber(day.apparent_tmax) }}°C</b></div>
                      <div class="detail-item"><i class="fas fa-thermometer-empty"></i> Cảm nhận min: <b>{{
                        formatNumber(day.apparent_tmin) }}°C</b></div>
                      <div class="detail-item"><i class="fas fa-cloud-showers-heavy"></i> Tổng mưa: <b>{{
                          formatNumber(day.rain_sum) }} mm</b></div>
                      <div class="detail-item"><i class="fas fa-hourglass-half"></i> Số giờ mưa: <b>{{
                        formatNumber(day.precip_hours) }} h</b></div>
                      <div class="detail-item"><i class="fas fa-location-arrow"></i> Gió (sin): <b>{{
                        formatNumber(day.wind_dir_sin) }}</b></div>
                      <div class="detail-item"><i class="fas fa-location-arrow"></i> Gió (cos): <b>{{
                        formatNumber(day.wind_dir_cos) }}</b></div>
                      <div class="detail-item"><i class="fas fa-tint"></i> Bốc hơi ET0: <b>{{ formatNumber(day.evapo_et0) }}
                          mm</b></div>
                    </div>
                  </div>
                </transition>
              </div>
            </div>
          </div>
          <!-- <div class="metrics">
            <div class="metric-card" v-for="(value, key) in metrics" :key="key">
              <div class="metric-title">{{ metricLabels[key] || key }}</div>
              <div class="metric-value">{{ formatNumber(value) }}</div>
            </div>
          </div> -->

          <div class="weather-averages" v-if="weatherAverages" data-tour="averages">
            <h3 class="averages-title">
              <i class="fas fa-chart-line"></i>
              Thống kê trung bình 7 ngày
            </h3>
            <div class="averages-grid">
              <div class="average-card">
                <i class="fas fa-temperature-high"></i>
                <div class="average-content">
                  <div class="average-label">Nhiệt độ cao nhất</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgTmax) }}°C</div>
                </div>
              </div>
              <div class="average-card">
                <i class="fas fa-temperature-low"></i>
                <div class="average-content">
                  <div class="average-label">Nhiệt độ thấp nhất</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgTmin) }}°C</div>
                </div>
              </div>
              <div class="average-card">
                <i class="fas fa-temperature-half"></i>
                <div class="average-content">
                  <div class="average-label">Nhiệt độ trung bình</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgTemp) }}°C</div>
                </div>
              </div>
              <div class="average-card">
                <i class="fas fa-cloud-rain"></i>
                <div class="average-content">
                  <div class="average-label">Lượng mưa</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgPrcp) }} mm</div>
                </div>
              </div>
              <div class="average-card">
                <i class="fas fa-wind"></i>
                <div class="average-content">
                  <div class="average-label">Tốc độ gió lớn nhất</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgWindSpeedMax) }} km/h</div>
                </div>
              </div>
              <div class="average-card">
                <i class="fas fa-clock"></i>
                <div class="average-content">
                  <div class="average-label">Số giờ mưa</div>
                  <div class="average-value">{{ formatNumber(weatherAverages.avgPrecipHours) }} h</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="affectedConstructions.length > 0" class="construction-warning" data-tour="warning">
            <div class="warning-header">
              <i class="fas fa-exclamation-triangle"></i>
              Cảnh báo: Các công trình có thể bị ảnh hưởng do mưa lớn
            </div>
            <div class="warning-content">
              <div class="rainfall-info">
                Lượng mưa trung bình dự báo: <span class="highlight">{{ averageRainfall.toFixed(1) }} mm/ngày</span>
              </div>
              <div class="affected-constructions">
                <div v-for="construction in affectedConstructions" :key="construction.id" class="construction-item">
                  <i class="fas fa-building"></i>
                  <div class="construction-details">
                    <div class="construction-name">{{ construction.constructionName }}</div>
                    <div class="construction-status">
                      Trạng thái: <span :class="'status-' + construction.constructionStatusID">
                        {{ construction.statusName }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../api.js'
import { useConstructionManagement } from '@/composables/useConstructionManagement'
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Fix lỗi icon marker mặc định của Leaflet khi dùng với bundler như Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const { constructions, fetchConstructions } = useConstructionManagement()

// State cho bản đồ và vị trí
const zoom = ref(6) // Zoom level để xem toàn bộ Việt Nam
const mapCenter = ref([16.0583, 108.2772]) // Mặc định ở giữa Việt Nam
const selectedLatitude = ref(16.0583)
const selectedLongitude = ref(108.2772)

const markerLatLng = computed(() => {
  return [selectedLatitude.value, selectedLongitude.value]
})

const selectedLocation = computed(() => ({
  name: 'Vị trí đã chọn',
  lat: selectedLatitude.value,
  lng: selectedLongitude.value
}))

const loading = ref(false)
const error = ref('')
const forecast = ref([])
const metrics = ref({})
const metricLabels = {
  accuracy: 'Độ chính xác (%)',
  mse: 'MSE',
  rmse: 'RMSE',
  mae: 'MAE',
  mape: 'MAPE (%)'
}

// State cho tìm kiếm địa điểm
const searchQuery = ref('')
const searchResults = ref([])
const searching = ref(false)
let searchTimeout = null

const isNumber = (val) => typeof val === 'number' && !isNaN(val)
const formatNumber = (val) => isNumber(val) ? val.toFixed(2) : val

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const roundedForecast = computed(() =>
  forecast.value.slice(0, 7).map(row => {
    const newRow = { ...row }
    for (const key in newRow) {
      if (isNumber(newRow[key])) {
        newRow[key] = parseFloat(newRow[key].toFixed(2))
      }
    }
    newRow.date = formatDate(newRow.date)
    return newRow
  })
)

const detailOpen = ref(null)
function toggleDetail(idx) {
  detailOpen.value = detailOpen.value === idx ? null : idx
}

// Tính toán lượng mưa trung bình trong 7 ngày
const averageRainfall = computed(() => {
  if (!forecast.value || forecast.value.length === 0) return 0
  const totalRain = forecast.value.reduce((sum, day) => sum + (day.prcp || 0), 0)
  return totalRain / forecast.value.length
})

// Hàm lấy vị trí hiện tại
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectedLatitude.value = position.coords.latitude
        selectedLongitude.value = position.coords.longitude
        mapCenter.value = [selectedLatitude.value, selectedLongitude.value]
        zoom.value = 13 // Phóng to vị trí hiện tại
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

// Hàm xử lý khi click trên bản đồ
const handleMapClick = (event) => {
  if (event.latlng) {
    selectedLatitude.value = event.latlng.lat
    selectedLongitude.value = event.latlng.lng
    zoom.value = Math.max(zoom.value, 10) // Phóng to một chút khi chọn vị trí mới
    // Đóng search results khi click trên map
    searchResults.value = []
  }
}

// Hàm xử lý input tìm kiếm với debounce
const handleSearchInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }
  
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 500) // Debounce 500ms
}

// Hàm thực hiện tìm kiếm địa điểm
const performSearch = async () => {
  if (!searchQuery.value.trim() || searchQuery.value.trim().length < 2) {
    searchResults.value = []
    return
  }
  
  searching.value = true
  searchResults.value = []
  
  try {
    // Sử dụng Nominatim API của OpenStreetMap để tìm kiếm
    // Giới hạn kết quả trong khu vực Việt Nam
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(searchQuery.value)}` +
      `&format=json` +
      `&limit=5` +
      `&bounded=1` +
      `&viewbox=102.1,23.4,109.5,8.5` +
      `&countrycodes=vn` +
      `&addressdetails=1`
    )
    
    if (!response.ok) {
      throw new Error('Lỗi khi tìm kiếm địa điểm')
    }
    
    const data = await response.json()
    searchResults.value = data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type || item.class || 'Địa điểm',
      importance: item.importance || 0
    })).sort((a, b) => b.importance - a.importance)
    
  } catch (err) {
    console.error('Error searching location:', err)
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

// Hàm chọn kết quả tìm kiếm
const selectSearchResult = (result) => {
  selectedLatitude.value = result.lat
  selectedLongitude.value = result.lon
  mapCenter.value = [result.lat, result.lon]
  zoom.value = 13 // Phóng to vị trí đã chọn
  searchQuery.value = result.display_name
  searchResults.value = []
}

// Hàm xóa tìm kiếm
const clearSearch = () => {
  searchQuery.value = ''
  searchResults.value = []
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
}

// Lọc các công trình bị ảnh hưởng bởi mưa
// Note: Vì giờ chọn vị trí tự do trên map, không thể match với provinceName nữa
// Có thể cải thiện bằng cách reverse geocoding hoặc tính khoảng cách
const affectedConstructions = computed(() => {
  if (averageRainfall.value <= 7) return []
  // Tạm thời return empty vì không có province info từ map coordinates
  return []
})

const getForecastCacheKey = (location) => {
  const today = new Date().toISOString().slice(0, 10)
  return `weather_forecast_${location.name}_${today}`
}

const fetchForecast = async () => {
  loading.value = true
  error.value = ''
  try {
    const lat = selectedLatitude.value
    const lng = selectedLongitude.value
    const res = await api.get('/Weather/predict', {
      params: {
        lat: lat.toFixed(4),
        lng: lng.toFixed(4)
      }
    })
    
    // Kiểm tra response có dữ liệu hợp lệ không
    if (!res.data || !res.data.forecast) {
      error.value = 'Không nhận được dữ liệu dự báo từ server'
      return
    }
    
    forecast.value = res.data.forecast
    metrics.value = res.data.metrics || {}
  } catch (err) {
    console.error('Error fetching weather forecast:', err)
    
    // Xử lý lỗi chi tiết hơn
    if (err.response) {
      // Server trả về response nhưng có status lỗi
      const status = err.response.status
      const message = err.response.data?.message || err.response.data || 'Lỗi từ server'
      
      if (status === 500) {
        error.value = `Lỗi server (500): ${message}. Vui lòng kiểm tra cấu hình Python script hoặc liên hệ quản trị viên.`
      } else if (status === 400) {
        error.value = `Dữ liệu không hợp lệ (400): ${message}`
      } else {
        error.value = `Lỗi ${status}: ${message}`
      }
    } else if (err.request) {
      // Request đã được gửi nhưng không nhận được response
      error.value = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
    } else {
      // Lỗi khác
      error.value = err.message || 'Lỗi không xác định khi tải dự báo thời tiết'
    }
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchConstructions()
})

// Thêm các computed properties cho các giá trị trung bình
const weatherAverages = computed(() => {
  if (!forecast.value || forecast.value.length === 0) return null

  const sum = forecast.value.reduce((acc, day) => ({
    tmax: acc.tmax + (day.tmax || 0),
    tmin: acc.tmin + (day.tmin || 0),
    prcp: acc.prcp + (day.prcp || 0),
    wind_speed_max: acc.wind_speed_max + (day.wind_speed_max || 0),
    precip_hours: acc.precip_hours + (day.precip_hours || 0),
  }), { tmax: 0, tmin: 0, prcp: 0, wind_speed_max: 0, precip_hours: 0 })

  const count = forecast.value.length

  return {
    avgTmax: sum.tmax / count,
    avgTmin: sum.tmin / count,
    avgTemp: (sum.tmax + sum.tmin) / (2 * count),
    avgPrcp: sum.prcp / count,
    avgWindSpeedMax: sum.wind_speed_max / count,
    avgPrecipHours: sum.precip_hours / count,
  }
})

const showTourGuide = ref(false)
</script>

<style scoped>
.weather-forecast-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.location-select {
  margin-bottom: 2rem;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 1.5rem 2rem;
}

.location-header {
  margin-bottom: 1.5rem;
}

.location-header h4 {
  color: #2980b9;
  margin: 0;
  font-size: 1.25rem;
}

.location-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1.5rem;
  align-items: start;
}

.location-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-item label {
  font-weight: 600;
  color: #6c757d;
  font-size: 0.9rem;
}

.info-item span {
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
}

.location-info .btn {
  width: 100%;
}

.map-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Search Box Styles */
.search-box {
  position: relative;
  z-index: 1000;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.search-input-wrapper:focus-within {
  border-color: #2980b9;
  box-shadow: 0 4px 12px rgba(41, 128, 185, 0.2);
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #6c757d;
  font-size: 16px;
  pointer-events: none;
}

.search-input {
  flex: 1;
  padding: 12px 40px 12px 40px;
  border: none;
  outline: none;
  font-size: 14px;
  color: #2c3e50;
  background: transparent;
}

.search-input::placeholder {
  color: #adb5bd;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-search-btn:hover {
  background: #f1f3f5;
  color: #2c3e50;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1001;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f1f3f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: #f8f9fa;
}

.search-result-item i {
  color: #2980b9;
  font-size: 16px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-type {
  font-size: 12px;
  color: #6c757d;
  text-transform: capitalize;
}

.search-loading {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 2px solid #dee2e6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c757d;
  font-size: 14px;
  z-index: 1001;
}

.search-loading i {
  color: #2980b9;
}

.map-wrapper {
  height: 400px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dee2e6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.map-hint {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
  display: flex;
  align-items: center;
}

.map-hint i {
  color: #2980b9;
}

@media (max-width: 992px) {
  .location-content {
    grid-template-columns: 1fr;
  }
  
  .location-info {
    order: 2;
  }
  
  .map-container {
    order: 1;
  }
  
  .search-input {
    font-size: 13px;
    padding: 10px 36px 10px 36px;
  }
  
  .search-input::placeholder {
    font-size: 13px;
  }
}

.weather-forecast-view {
  flex: 1;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.forecast-content {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error {
  text-align: center;
  font-size: 1.2rem;
  margin: 2rem 0;
  color: #dc3545;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.forecast-card {
  background: white;
  border-radius: 14px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: box-shadow 0.2s;
}

.forecast-card:hover {
  box-shadow: 0 8px 24px rgba(52, 152, 219, 0.13);
}

.card-header {
  font-size: 1.1rem;
  color: #2980b9;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.card-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  margin-bottom: 2px;
}

.card-row .label {
  color: #6c757d;
  min-width: 120px;
}

.card-row .value {
  color: #2c3e50;
  font-weight: 600;
}

.card-row.sub {
  font-size: 0.95rem;
  color: #888;
  gap: 1.2rem;
  margin-left: 1.2rem;
}

.temp-high {
  color: #e74c3c;
}

.temp-low {
  color: #3498db;
}

.rain {
  color: #4bc0c0;
}

.sun {
  color: #f1c40f;
}

.wind {
  color: #7ed6df;
}

.metrics {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.metric-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  padding: 1.5rem 2rem;
  min-width: 180px;
  text-align: center;
}

.metric-title {
  color: #6c757d;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.metric-value {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: bold;
}

.detail-btn {
  margin: 1rem 0 0.5rem 0;
  background: #f1f3f5;
  color: #2980b9;
  border: none;
  border-radius: 6px;
  padding: 0.4rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.detail-btn:hover {
  background: #e0e7ef;
}

.detail-panel {
  background: #f8fafd;
  border-left: 4px solid #3498db;
  margin-top: 0.7rem;
  margin-bottom: 0.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0 12px 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.7rem;
}

.detail-item {
  background: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.03);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(5px);
  border-radius: 16px;
  z-index: 10;
}

.loading-text {
  color: #2980b9;
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  border-width: 0.3rem;
}


.construction-warning {
  background: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 12px;
  margin-bottom: 2rem;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.warning-header {
  background: #fff3cd;
  color: #856404;
  padding: 1rem 1.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid #ffeeba;
}

.warning-content {
  padding: 1.5rem;
  background: white;
}

.rainfall-info {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: #495057;
}

.highlight {
  color: #e74c3c;
  font-weight: 600;
}

.affected-constructions {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.construction-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.construction-item:hover {
  transform: translateY(-2px);
}

.construction-item i {
  font-size: 1.5rem;
  color: #6c757d;
}

.construction-details {
  flex: 1;
}

.construction-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.construction-status {
  font-size: 0.9rem;
  color: #6c757d;
}

.status-1 { color: #ffc107; } /* Chờ khởi công */
.status-2 { color: #17a2b8; } /* Đang thi công */
.status-3 { color: #dc3545; } /* Tạm dừng */
.status-4 { color: #28a745; } /* Hoàn thành */
.status-5 { color: #6c757d; } /* Hủy bỏ */

.weather-averages {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.averages-title {
  font-size: 1.25rem;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.averages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.average-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.average-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.average-card i {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #e9ecef;
}

.average-card:nth-child(1) i { color: #e74c3c; }  /* Nhiệt độ cao */
.average-card:nth-child(2) i { color: #3498db; }  /* Nhiệt độ thấp */
.average-card:nth-child(3) i { color: #f39c12; }  /* Nhiệt độ trung bình */
.average-card:nth-child(4) i { color: #4bc0c0; }  /* Lượng mưa */
.average-card:nth-child(5) i { color: #7ed6df; }  /* Gió */
.average-card:nth-child(6) i { color: #a8a8a8; }  /* Giờ mưa */

.average-content {
  flex: 1;
}

.average-label {
  color: #6c757d;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.average-value {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .averages-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .average-card {
    padding: 1rem;
  }

  .average-value {
    font-size: 1.1rem;
  }
}
</style>
