<template>
  <div>
    <h1>父1组件</h1>
    <p>父1组件状态: {{ parentA1 }}</p>
    <App1 :a1="parentA1" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import App1 from './App1.vue'

const parentA1 = ref('初始值')
</script>
