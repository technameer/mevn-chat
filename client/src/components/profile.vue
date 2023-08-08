<template>
    <h1>
        logged in!
    </h1>
</template>

<script setup>
    import axios from "axios"
    import { onMounted } from "vue";

    async function mounted(){
        const response = await axios.get("/profile")
        
    }
    onMounted(mounted)
</script>