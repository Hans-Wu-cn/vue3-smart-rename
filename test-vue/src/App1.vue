<template>
  <div>
    <h1>父组件</h1>
    <p>父组件状态: {{ a1 }}</p>
    <ChildComponent1 :a1="a1" />
  </div>
</template>

<script setup>
import { PropType } from 'vue'
import ChildComponent1 from './components/ChildComponent1.vue'

const props = defineProps({
  a1: {
    type: [String, Number, Array] as PropType<string | number | Array<any>>
  },
})
</script>
