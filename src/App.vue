<script setup>
import MainLayout from './components/layout/MainLayout.vue'
import LoginView from './views/LoginView.vue'
import { useAuth } from './composables/useAuth'
import Toast from './components/common/Toast.vue'

const { isAuthenticated } = useAuth()
</script>

<template>
  <div id="app">
    <Toast />
    <MainLayout v-if="isAuthenticated">
      <router-view></router-view>
    </MainLayout>
    <LoginView v-else />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f5f5;
}
</style>
