<template>
  <div class="weather-forecast-container">
    <div class="location-select">
      <label for="location">Chọn vị trí:</label>
      <select id="location" v-model="selectedLocation">
        <option v-for="loc in locations" :value="loc" :key="loc.name">
          {{ loc.name }}
        </option>
      </select>
      <div>
        <b>Kinh độ:</b> {{ selectedLocation.lng }} | <b>Vĩ độ:</b> {{ selectedLocation.lat }}
      </div>
      <button @click="fetchForecast">Lấy dự báo cho vị trí này</button>
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
          <div class="forecast-grid">
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

          <div class="weather-averages" v-if="weatherAverages">
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

          <div v-if="affectedConstructions.length > 0" class="construction-warning">
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

const { constructions, fetchConstructions } = useConstructionManagement()

const locations = [
  { name: 'An Giang', lat: 10.5216, lng: 105.1259 },
  { name: 'Bà Rịa - Vũng Tàu', lat: 10.5417, lng: 107.2428 },
  { name: 'Bắc Giang', lat: 21.2810, lng: 106.1978 },
  { name: 'Bắc Kạn', lat: 22.1470, lng: 105.8348 },
  { name: 'Bạc Liêu', lat: 9.2941, lng: 105.7278 },
  { name: 'Bắc Ninh', lat: 21.1861, lng: 106.0763 },
  { name: 'Bến Tre', lat: 10.2434, lng: 106.3756 },
  { name: 'Bình Định', lat: 13.782, lng: 109.219 },
  { name: 'Bình Dương', lat: 11.3254, lng: 106.4770 },
  { name: 'Bình Phước', lat: 11.7512, lng: 106.7235 },
  { name: 'Bình Thuận', lat: 11.0904, lng: 108.0721 },
  { name: 'Cà Mau', lat: 9.1527, lng: 105.1961 },
  { name: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
  { name: 'Cao Bằng', lat: 22.6657, lng: 106.2570 },
  { name: 'Đà Nẵng', lat: 16.0471, lng: 108.2068 },
  { name: 'Đắk Lắk', lat: 12.7100, lng: 108.2378 },
  { name: 'Đắk Nông', lat: 12.2644, lng: 107.6098 },
  { name: 'Điện Biên', lat: 21.3860, lng: 103.0230 },
  { name: 'Đồng Nai', lat: 10.9453, lng: 106.8246 },
  { name: 'Đồng Tháp', lat: 10.4930, lng: 105.6882 },
  { name: 'Gia Lai', lat: 13.8079, lng: 108.1098 },
  { name: 'Hà Giang', lat: 22.8233, lng: 104.9836 },
  { name: 'Hà Nam', lat: 20.5836, lng: 105.9229 },
  { name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { name: 'Hà Tĩnh', lat: 18.3559, lng: 105.8875 },
  { name: 'Hải Dương', lat: 20.9373, lng: 106.3147 },
  { name: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { name: 'Hậu Giang', lat: 9.7579, lng: 105.6413 },
  { name: 'Hòa Bình', lat: 20.8171, lng: 105.3376 },
  { name: 'Hưng Yên', lat: 20.8526, lng: 106.0160 },
  { name: 'Khánh Hòa', lat: 12.2585, lng: 109.0526 },
  { name: 'Kiên Giang', lat: 10.0080, lng: 105.0782 },
  { name: 'Kon Tum', lat: 14.3490, lng: 108.0000 },
  { name: 'Lai Châu', lat: 22.3862, lng: 103.4708 },
  { name: 'Lâm Đồng', lat: 11.5753, lng: 108.1429 },
  { name: 'Lạng Sơn', lat: 21.8537, lng: 106.7615 },
  { name: 'Lào Cai', lat: 22.4851, lng: 103.9707 },
  { name: 'Long An', lat: 10.5437, lng: 106.4111 },
  { name: 'Nam Định', lat: 20.4388, lng: 106.1621 },
  { name: 'Nghệ An', lat: 19.2342, lng: 104.9200 },
  { name: 'Ninh Bình', lat: 20.2506, lng: 105.9745 },
  { name: 'Ninh Thuận', lat: 11.6739, lng: 108.9902 },
  { name: 'Phú Thọ', lat: 21.3450, lng: 105.1996 },
  { name: 'Phú Yên', lat: 13.0882, lng: 109.0929 },
  { name: 'Quảng Bình', lat: 17.4689, lng: 106.6223 },
  { name: 'Quảng Nam', lat: 15.5394, lng: 108.0191 },
  { name: 'Quảng Ngãi', lat: 15.1201, lng: 108.7923 },
  { name: 'Quảng Ninh', lat: 21.0064, lng: 107.2925 },
  { name: 'Quảng Trị', lat: 16.8183, lng: 107.1021 },
  { name: 'Sóc Trăng', lat: 9.6026, lng: 105.9739 },
  { name: 'Sơn La', lat: 21.3256, lng: 103.9188 },
  { name: 'Tây Ninh', lat: 11.3659, lng: 106.0986 },
  { name: 'Thái Bình', lat: 20.4463, lng: 106.3365 },
  { name: 'Thái Nguyên', lat: 21.5942, lng: 105.8480 },
  { name: 'Thanh Hóa', lat: 19.8067, lng: 105.7852 },
  { name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909 },
  { name: 'Tiền Giang', lat: 10.4491, lng: 106.3421 },
  { name: 'TP.HCM', lat: 10.7769, lng: 106.7009 },
  { name: 'Trà Vinh', lat: 9.9345, lng: 106.3452 },
  { name: 'Tuyên Quang', lat: 21.8236, lng: 105.2149 },
  { name: 'Vĩnh Long', lat: 10.2539, lng: 105.9722 },
  { name: 'Vĩnh Phúc', lat: 21.3089, lng: 105.6049 },
  { name: 'Yên Bái', lat: 21.7056, lng: 104.8945 }
]
const selectedLocation = ref(locations[0])

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

// Lọc các công trình bị ảnh hưởng bởi mưa
const affectedConstructions = computed(() => {
  if (averageRainfall.value <= 7) return []
  return constructions.value.filter(construction =>
    construction.provinceName === selectedLocation.value.name &&
    construction.constructionStatusID !== 4 // Không phải hoàn thành
  )
})

const getForecastCacheKey = (location) => {
  const today = new Date().toISOString().slice(0, 10)
  return `weather_forecast_${location.name}_${today}`
}

const fetchForecast = async () => {
  loading.value = true
  error.value = ''
  try {
    const lat = selectedLocation.value.lat
    const lng = selectedLocation.value.lng
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
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.location-select label {
  font-weight: 600;
  color: #2980b9;
}

.location-select select {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

.location-select button {
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.location-select button:hover {
  background: #217dbb;
}

.location-select b {
  color: #2c3e50;
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
