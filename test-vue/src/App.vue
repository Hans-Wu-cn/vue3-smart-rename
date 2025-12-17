<template>
  <div>
    <h1>父组件</h1>
    <p>父组件状态: {{ parentA1 }}</p>
    <ChildComponent :a1="parentA1" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChildComponent from './components/ChildComponent.vue'

const parentA1 = ref('初始值')
</script>
