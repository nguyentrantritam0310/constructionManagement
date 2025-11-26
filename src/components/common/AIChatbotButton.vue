<template>
  <div class="ai-chatbot-container">
    <!-- Chat Bubble -->
    <div class="chat-bubble" :class="{ 'show': showChatBubble }">
      <div class="chat-bubble-shimmer"></div>
      <div class="chat-bubble-content">
        <div class="chat-bubble-header">
          <div class="header-icon-wrapper">
            <i class="fas fa-robot"></i>
            <div class="icon-glow"></div>
          </div>
          <span>Trợ lý AI</span>
        </div>
        <div class="chat-bubble-message">
          <p>{{ message || 'Xin chào! Tôi có thể giúp gì cho bạn?' }}</p>
        </div>
        <div class="chat-bubble-actions">
          <button class="chat-action-btn" @click.stop="handleGuideClick">
            <i class="fas fa-question-circle"></i>
            <span>Hướng dẫn</span>
            <div class="btn-shine"></div>
          </button>
        </div>
      </div>
      <div class="chat-bubble-arrow"></div>
    </div>
    
    <!-- Chatbot Button -->
    <div 
      class="ai-chatbot-button" 
      @click.stop="toggleChatBubble()"
      :title="title || 'Trợ lý AI'"
    >
      <div class="button-bg-glow"></div>
      <div class="button-shimmer"></div>
      <div class="button-inner-glow"></div>
      <div class="robot-icon">
        <i class="fas fa-robot"></i>
        <div class="icon-aura"></div>
      </div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring-secondary"></div>
      <div class="notification-dot" v-if="!showChatBubble">
        <div class="dot-pulse"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  message: {
    type: String,
    default: 'Xin chào! Tôi có thể giúp gì cho bạn?'
  },
  title: {
    type: String,
    default: 'Trợ lý AI'
  },
  autoShow: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['guide-click'])

const showChatBubble = ref(false)

// Watch for autoShow prop changes
watch(() => props.autoShow, (newVal) => {
  if (newVal) {
    showChatBubble.value = true
  }
}, { immediate: true })

// Close chat bubble when clicking outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const toggleChatBubble = () => {
  showChatBubble.value = !showChatBubble.value
}

const handleClickOutside = (event) => {
  const chatbotContainer = document.querySelector('.ai-chatbot-container')
  if (chatbotContainer && !chatbotContainer.contains(event.target)) {
    showChatBubble.value = false
  }
}

const handleGuideClick = () => {
  showChatBubble.value = false
  emit('guide-click')
}
</script>

<style scoped>
/* AI Chatbot Container - Fixed Bottom Right */
.ai-chatbot-container {
  position: fixed !important;
  bottom: 30px !important;
  right: 30px !important;
  z-index: 9999 !important;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 20px;
  pointer-events: none;
}

/* Chat Bubble */
.chat-bubble {
  position: relative;
  min-width: 280px;
  max-width: 320px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 20px;
  box-shadow: 
    0 12px 40px rgba(52, 152, 219, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(20px) scale(0.9);
  pointer-events: none;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(52, 152, 219, 0.2);
  overflow: hidden;
}

.chat-bubble.show {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.chat-bubble-content {
  padding: 16px;
  position: relative;
  z-index: 1;
}

.chat-bubble-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(52, 152, 219, 0.15);
}

.chat-bubble-header i {
  color: #3498db;
  font-size: 18px;
  animation: icon-pulse 2s ease-in-out infinite;
  margin-right: 8px;
}

.chat-bubble-header span {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  letter-spacing: 0.3px;
}

.chat-bubble-message {
  margin-bottom: 12px;
  padding: 10px;
  background: rgba(52, 152, 219, 0.05);
  border-radius: 10px;
  border-left: 3px solid #3498db;
}

.chat-bubble-message p {
  margin: 0;
  color: #34495e;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 400;
}

.chat-bubble-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.chat-action-btn {
  flex: 1;
  padding: 10px 16px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.chat-action-btn:hover {
  background: linear-gradient(135deg, #2c3e50 0%, #2980b9 100%);
  box-shadow: 0 4px 14px rgba(52, 152, 219, 0.35);
  transform: translateY(-1px);
}

.chat-action-btn:active {
  transform: translateY(0);
}

.chat-bubble-arrow {
  position: absolute;
  bottom: -8px;
  right: 30px;
  width: 16px;
  height: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid rgba(52, 152, 219, 0.2);
  border-bottom: 1px solid rgba(52, 152, 219, 0.2);
  transform: rotate(45deg);
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

/* AI Chatbot Button */
.ai-chatbot-button {
  position: relative;
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 
    0 8px 24px rgba(52, 152, 219, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: float 3s ease-in-out infinite;
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow: visible;
  pointer-events: auto;
}

.ai-chatbot-button:hover {
  transform: scale(1.1);
  box-shadow: 
    0 12px 32px rgba(52, 152, 219, 0.5),
    inset 0 2px 8px rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.ai-chatbot-button:active {
  transform: scale(1.05);
}

.robot-icon {
  position: relative;
  z-index: 2;
  color: white;
  font-size: 32px;
  animation: robot-blink 3s ease-in-out infinite;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  transition: transform 0.3s ease;
}

.ai-chatbot-button:hover .robot-icon {
  transform: scale(1.1);
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border: 2px solid rgba(52, 152, 219, 0.6);
  border-radius: 50%;
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  box-shadow: 
    0 0 0 0 rgba(52, 152, 219, 0.7),
    0 0 20px rgba(52, 152, 219, 0.5);
}

.pulse-ring::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 110%;
  height: 110%;
  border: 1.5px solid rgba(52, 152, 219, 0.5);
  border-radius: 50%;
  animation: pulse-ring-middle 2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.25s;
}

.pulse-ring::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  border: 1px solid rgba(52, 152, 219, 0.4);
  border-radius: 50%;
  animation: pulse-ring-outer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite 0.5s;
  box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 12px;
  height: 12px;
  background: #e74c3c;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse-dot 2s ease-in-out infinite;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.6);
  z-index: 3;
}


@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-12px);
  }
}

@keyframes robot-blink {
  0%, 88%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  92%, 96% {
    opacity: 0.4;
    transform: scale(0.95);
  }
}

@keyframes icon-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
    box-shadow: 
      0 0 0 0 rgba(52, 152, 219, 0.7),
      0 0 20px rgba(52, 152, 219, 0.5);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.4);
    opacity: 0;
    box-shadow: 
      0 0 0 20px rgba(52, 152, 219, 0),
      0 0 40px rgba(52, 152, 219, 0);
  }
}

@keyframes pulse-ring-middle {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

@keyframes pulse-ring-outer {
  0% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
    box-shadow: 0 0 15px rgba(52, 152, 219, 0.3);
  }
  100% {
    transform: translate(-50%, -50%) scale(1.6);
    opacity: 0;
    box-shadow: 0 0 30px rgba(52, 152, 219, 0);
  }
}

@keyframes pulse-dot {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .ai-chatbot-button {
    width: 56px;
    height: 56px;
  }
  
  .robot-icon {
    font-size: 24px;
  }
  
  .chat-bubble {
    min-width: 240px;
    max-width: 280px;
  }
}
</style>

