<template>
    <div :class="['w-8', 'h-8','relative', 'rounded-full', 'flex', 'justify-center', 'items-center', color,'cursor-pointer']">
      <div class=" text-center  cursor-pointer ">{{ firstLetter }}</div>
      <div :class="['absolute' ,'w-2', 'h-2' ,online == true?'bg-green-600':'bg-gray-400' ,'rounded' ,'bottom-0', 'right-0']"></div>
    </div>
  </template>
  
  <script>
  import {  ref, onMounted, toRef } from 'vue';
  
  export default {
    props: {
      firstLetter: String,
      userId: String,
      online: Boolean
    },
    setup(props) {
      const colors = ['bg-teal-200', 'bg-red-200', 'bg-green-200', 'bg-purple-200', 'bg-blue-200', 'bg-yellow-200', 'bg-orange-200', 'bg-pink-200', 'bg-fuchsia-200', 'bg-rose-200'];
      
      const userIdRef = toRef(props, 'userId');
      const color = ref('');
  
      onMounted(() => {
        const userIdBase10 = parseInt(userIdRef.value.substring(10), 16);
        const colorIndex = userIdBase10 % colors.length;
        color.value = colors[colorIndex];
      });
  
      return {
        color
      };
    }
  };
  </script>
  