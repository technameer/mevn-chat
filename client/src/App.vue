<script setup>
import axios from "axios"
axios.defaults.baseURL = "http://localhost:8080"
axios.defaults.withCredentials = true
</script>

<template>
    <router-view></router-view>
</template>

