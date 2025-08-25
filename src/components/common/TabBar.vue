<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeTab: {
    type: String,
    required: true
  },
  visibleTabsCount: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:activeTab'])

const showMoreTabs = ref(false) // Control visibility of the "More" dropdown

const visibleTabs = computed(() => props.tabs.slice(0, props.visibleTabsCount))
const hiddenTabs = computed(() => props.tabs.slice(props.visibleTabsCount))

const selectTab = (tabKey) => {
  emit('update:activeTab', tabKey)
  showMoreTabs.value = false // Close the "More" dropdown when a tab is selected
}
</script>

<template>
  <div class="tab-bar">
    <!-- Visible Tabs -->
    <div
      v-for="tab in visibleTabs"
      :key="tab.key"
      class="tab-bar-item"
      :class="{ active: activeTab === tab.key }"
      @click="selectTab(tab.key)"
    >
      <i :class="tab.icon" class="tab-bar-icon"></i>
      <span class="tab-bar-label">{{ tab.label }}</span>
    </div>

    <!-- "More" Button -->
    <div v-if="hiddenTabs.length" class="tab-bar-item more-tab" @click="showMoreTabs = !showMoreTabs">
      <i class="fas fa-ellipsis-h tab-bar-icon"></i>
      <span class="tab-bar-label">Thêm</span>
    </div>

    <!-- Dropdown for Hidden Tabs -->
    <div v-if="showMoreTabs" class="more-tabs-dropdown">
      <div
        v-for="tab in hiddenTabs"
        :key="tab.key"
        class="dropdown-tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="selectTab(tab.key)"
      >
        <i :class="tab.icon" class="dropdown-tab-icon"></i>
        <span class="dropdown-tab-label">{{ tab.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  gap: 8px;
  border-radius: 8px;
  background: #f5f7fa;
  padding: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  margin-bottom: 1rem;
  position: relative;
}

.tab-bar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
  background: transparent;
}

.tab-bar-item .tab-bar-icon {
  font-size: 1.15rem;
  color: #0d6efd;
}

.tab-bar-item.active {
  background: #e9ecef;
  color: #0d6efd;
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.07);
}

.tab-bar-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}

.more-tab {
  position: relative;
}

.more-tabs-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  padding: 8px;
  min-width: 200px;
}

.dropdown-tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #222;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.dropdown-tab-item .dropdown-tab-icon {
  font-size: 1.1rem;
  color: #0d6efd;
}

.dropdown-tab-item.active {
  background: #e9ecef;
  color: #0d6efd;
}

.dropdown-tab-item:hover {
  background: #f0f6ff;
  color: #0d6efd;
}
</style>
