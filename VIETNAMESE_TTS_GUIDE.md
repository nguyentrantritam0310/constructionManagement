# Hướng dẫn sử dụng Text-to-Speech tiếng Việt

## Tổng quan

Dự án đã được tích hợp công cụ Text-to-Speech (TTS) tiếng Việt với nhiều phương thức khác nhau để phát giọng nói tiếng Việt Nam tự nhiên.

## Các phương thức TTS hỗ trợ

### 1. **Web Speech API** (Miễn phí)
- ✅ **Ưu điểm**: Miễn phí, không cần API key, hoạt động ngay
- ⚠️ **Nhược điểm**: Chất lượng giọng nói phụ thuộc vào trình duyệt, có thể không có giọng tiếng Việt trên một số trình duyệt
- 📌 **Cách dùng**: `tts-method="web"`

### 2. **Google Translate TTS** (Miễn phí - Khuyên dùng nếu Web Speech không có giọng Việt)
- ✅ **Ưu điểm**: Miễn phí, không cần API key, luôn có giọng tiếng Việt
- ⚠️ **Nhược điểm**: Có thể bị rate limit, chất lượng không bằng FPT.AI hoặc Google Cloud TTS
- 📌 **Cách dùng**: `tts-method="googletranslate"`

### 3. **FPT.AI TTS** (Khuyên dùng - Của Việt Nam)
- ✅ **Ưu điểm**: Giọng tiếng Việt tự nhiên, chất lượng cao, của công ty Việt Nam
- ⚠️ **Nhược điểm**: Cần đăng ký API key (có thể có gói miễn phí)
- 📌 **Cách dùng**: 
  1. Đăng ký tại: https://fpt.ai/tts
  2. Lấy API key
  3. Thêm vào file `.env`: `VITE_FPT_AI_API_KEY=your_api_key_here`
  4. Sử dụng với `tts-method="fpt"` trong component

### 4. **Google Cloud TTS** (Chất lượng cao)
- ✅ **Ưu điểm**: Giọng nói chất lượng rất cao, nhiều giọng khác nhau
- ⚠️ **Nhược điểm**: Cần đăng ký Google Cloud, có phí (có gói miễn phí giới hạn)
- 📌 **Cách dùng**:
  1. Đăng ký Google Cloud TTS API
  2. Lấy API key
  3. Thêm vào file `.env`: `VITE_GOOGLE_TTS_API_KEY=your_api_key_here`
  4. Sử dụng với `tts-method="google"` trong component

## Cách sử dụng trong TourGuide

### Sử dụng mặc định (Tự động chọn - Khuyên dùng)
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="auto"
/>
```
- Sẽ tự động thử: FPT.AI → Web Speech → Google Translate TTS

### Sử dụng Google Translate TTS (Miễn phí, luôn có giọng Việt)
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="googletranslate"
/>
```

### Sử dụng Web Speech API
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="web"
/>
```

### Sử dụng FPT.AI TTS (Chất lượng tốt hơn)
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="fpt"
/>
```

### Sử dụng Google TTS
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="google"
/>
```

### Tự động chọn phương thức tốt nhất
```vue
<TourGuide 
  :show="showTour" 
  :steps="tourSteps"
  tts-method="auto"
/>
```
- Sẽ thử FPT.AI trước nếu có API key
- Nếu không có, sẽ fallback về Web Speech API

## Sử dụng trong code JavaScript/Vue

### Import composable
```javascript
import { useVietnameseTTS } from '@/composables/useVietnameseTTS'
```

### Sử dụng cơ bản
```javascript
const { speak, stop, isSpeaking } = useVietnameseTTS()

// Phát giọng nói
await speak('Xin chào, đây là giọng nói tiếng Việt')

// Dừng giọng nói
stop()
```

### Sử dụng với tùy chọn
```javascript
// Sử dụng FPT.AI
await speak('Xin chào', {
  method: 'fpt',
  voice: 'banmai', // banmai, linhsan, minhquang, etc.
  speed: '0.8'
})

// Sử dụng Google TTS
await speak('Xin chào', {
  method: 'google',
  voiceName: 'vi-VN-Wavenet-A', // hoặc vi-VN-Standard-A
  gender: 'FEMALE', // hoặc 'MALE'
  rate: 1.0,
  pitch: 0
})

// Sử dụng Web Speech API với tùy chọn
await speak('Xin chào', {
  method: 'web',
  rate: 0.9, // Tốc độ (0.1 - 10)
  pitch: 1.0, // Cao độ (0 - 2)
  volume: 1.0 // Âm lượng (0 - 1)
})

// Sử dụng Google Translate TTS (miễn phí, luôn có giọng Việt)
await speak('Xin chào', {
  method: 'googletranslate'
})
```

## Cấu hình môi trường (.env)

Tạo file `.env` trong thư mục `constructionManagement`:

```env
# FPT.AI TTS API Key (nếu muốn dùng FPT.AI)
VITE_FPT_AI_API_KEY=your_fpt_ai_api_key_here

# Google Cloud TTS API Key (nếu muốn dùng Google TTS)
VITE_GOOGLE_TTS_API_KEY=your_google_tts_api_key_here
```

## Danh sách giọng FPT.AI

FPT.AI cung cấp nhiều giọng tiếng Việt khác nhau:
- `banmai` - Giọng nữ, trẻ trung
- `linhsan` - Giọng nữ, chuyên nghiệp
- `minhquang` - Giọng nam, ấm áp
- Và nhiều giọng khác...

Xem thêm tại: https://fpt.ai/tts

## Danh sách giọng Google TTS

Google Cloud TTS cung cấp:
- `vi-VN-Standard-A` - Giọng nữ chuẩn
- `vi-VN-Standard-B` - Giọng nam chuẩn
- `vi-VN-Standard-C` - Giọng nữ khác
- `vi-VN-Standard-D` - Giọng nam khác
- `vi-VN-Wavenet-A` - Giọng nữ chất lượng cao (Wavenet)
- `vi-VN-Wavenet-B` - Giọng nam chất lượng cao (Wavenet)
- Và nhiều giọng khác...

Xem thêm tại: https://cloud.google.com/text-to-speech/docs/voices

## Lưu ý

1. **Web Speech API**: 
   - Hoạt động tốt trên Chrome, Edge
   - Có thể không có giọng tiếng Việt trên Firefox, Safari
   - Miễn phí, không cần cấu hình

2. **FPT.AI**:
   - Của công ty Việt Nam, giọng nói tự nhiên
   - Có thể có gói miễn phí với giới hạn
   - Cần internet để hoạt động

3. **Google TTS**:
   - Chất lượng rất cao
   - Có gói miễn phí với giới hạn (ví dụ: 0-4 triệu ký tự/tháng)
   - Cần internet để hoạt động

## Troubleshooting

### Không nghe thấy giọng nói
1. Kiểm tra console để xem có lỗi gì không
2. Kiểm tra quyền microphone/audio của trình duyệt
3. Thử đổi phương thức TTS khác

### Giọng nói không phải tiếng Việt
1. Đảm bảo đã set `lang: 'vi-VN'` hoặc sử dụng voice tiếng Việt
2. Với Web Speech API, một số trình duyệt có thể không có giọng tiếng Việt
3. Thử dùng FPT.AI hoặc Google TTS để có giọng tiếng Việt tốt hơn

### Lỗi API key
1. Kiểm tra API key đã đúng chưa
2. Kiểm tra API key có còn hạn không
3. Kiểm tra file `.env` đã được load chưa (cần restart dev server)

## Ví dụ hoàn chỉnh

```vue
<template>
  <div>
    <button @click="startTour">Bắt đầu tour</button>
    <TourGuide 
      :show="showTour" 
      :steps="tourSteps"
      tts-method="auto"
      @complete="onTourComplete"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import TourGuide from '@/components/common/TourGuide.vue'

const showTour = ref(false)
const tourSteps = ref([
  {
    target: '.btn-primary',
    message: 'Đây là nút chính để thực hiện hành động'
  },
  {
    target: '.form-control',
    message: 'Nhập thông tin vào đây'
  }
])

const startTour = () => {
  showTour.value = true
}

const onTourComplete = () => {
  console.log('Tour đã hoàn thành')
}
</script>
```

