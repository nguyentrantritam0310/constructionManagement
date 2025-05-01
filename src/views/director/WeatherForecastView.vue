
    <template #default>
      <div class="weather-forecast-view">
        <h2 class="title">
          <i class="fas fa-cloud-sun"></i>
          Dự báo thời tiết 7 ngày tới
        </h2>
        <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
        <div v-else-if="error" class="error">{{ error }}</div>
        <div v-else>
          <div class="chart-container">
            <Line :data="chartData" :options="chartOptions" />
          </div>
          <div class="metrics">
            <div class="metric-card" v-for="(value, key) in metrics" :key="key">
              <div class="metric-title">{{ metricLabels[key] || key }}</div>
              <div class="metric-value">{{ value }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>


<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '../../components/layout/MainLayout.vue'
import { Line } from 'vue-chartjs'
import {
  Chart,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

// Line.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale)

const loading = ref(true)
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

const chartData = ref({})
const chartOptions = ref({
  responsive: true,
  plugins: {
    legend: { position: 'top' },
    title: {
      display: true,
      text: 'Dự báo thời tiết 7 ngày tới'
    }
  }
})

async function fetchForecast() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/predict')
    if (!res.ok) throw new Error('Lỗi khi lấy dữ liệu dự báo')
    const data = await res.json()
    forecast.value = data.forecast
    metrics.value = data.metrics
    prepareChartData()
  } catch (err) {
    error.value = err.message || 'Lỗi không xác định'
  } finally {
    loading.value = false
  }
}

function prepareChartData() {
  if (!forecast.value.length) return
  const labels = forecast.value.map(d => d.date)
  chartData.value = {
    labels,
    datasets: [
      {
        label: 'Nhiệt độ cao nhất (°C)',
        data: forecast.value.map(d => d.tmax),
        borderColor: '#ff6384',
        backgroundColor: 'rgba(255,99,132,0.2)',
        tension: 0.4
      },
      {
        label: 'Nhiệt độ thấp nhất (°C)',
        data: forecast.value.map(d => d.tmin),
        borderColor: '#36a2eb',
        backgroundColor: 'rgba(54,162,235,0.2)',
        tension: 0.4
      },
      {
        label: 'Lượng mưa (mm)',
        data: forecast.value.map(d => d.prcp),
        borderColor: '#4bc0c0',
        backgroundColor: 'rgba(75,192,192,0.2)',
        yAxisID: 'y1',
        type: 'bar'
      },
      {
        label: 'Giờ nắng',
        data: forecast.value.map(d => d.sunshine_duration),
        borderColor: '#ffcd56',
        backgroundColor: 'rgba(255,205,86,0.2)',
        yAxisID: 'y2',
        type: 'bar'
      }
    ]
  }
  chartOptions.value = {
    ...chartOptions.value,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Nhiệt độ (°C)' }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Lượng mưa (mm)' }
      },
      y2: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Giờ nắng' },
        offset: true
      }
    }
  }
}

onMounted(fetchForecast)
</script>

<style scoped>
.weather-forecast-view {
  padding: 2rem;
  background: #f8f9fa;
  min-height: 100vh;
}
.title {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.loading, .error {
  text-align: center;
  font-size: 1.2rem;
  margin: 2rem 0;
}
.chart-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  padding: 2rem;
  margin-bottom: 2rem;
}
.metrics {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}
.metric-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
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
</style>
