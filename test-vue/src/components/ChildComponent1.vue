<template>
  <div>
    <h2>子组件</h2>
    <p>Props值: {{ a1 }}</p>
    <p>插值测试: {{ a1 }} 元</p>
    <button @click="changeValue">修改本地状态</button>
  </div>
</template>

<script setup>
import { PropType } from 'vue'

const props = defineProps({
  a1: {
    type: [String, Number, Array] as PropType<string | number | Array<any>>
  },
})
const changeValue = () => {
  // 这里不直接修改props，而是通过事件通知父组件
  // emit('update:a1', 'new value')
  console.log('尝试修改props值')
}
</script>
