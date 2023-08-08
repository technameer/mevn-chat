<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router"
import chat from "./chat.vue"
import axios from "axios"
const authenticated = ref(false)
const email = ref("")
const password = ref("")
const loginOrRegister = ref("register")
const router = useRouter()
function setLoginOrRegister(what) {
    loginOrRegister.value = what
}
function logout() {
    authenticated.value = false
}
async function register() {
    if (email.value != "" && password.value != "") {
        if (loginOrRegister.value == "register") {
            try {
                const response = await axios.post('/register', { email: email.value, password: password.value });;
                authenticated.value = true
            } catch (error) {
                console.error(error);
            }
        }
        else if (loginOrRegister.value == "login") {
            try {
                const response = await axios.post('/login', { email: email.value, password: password.value });
                authenticated.value = true
            } catch (error) {
                console.error(error);
            }
        }
    }
}
onMounted(async () => {
    const res = await axios.get('/profile')
    if(res.status == 200){
        email.value = res.data.email;
        authenticated.value = true
    }else{
        authenticated.value = false
    }
})


</script>

<template>
    <chat :email="email" v-if="authenticated" @logout="logout" />
    <div class=" h-screen bg-sky-100 flex items-center" v-else>
        <div class="mx-auto w-64">
            <form>
                <input v-model="email" class="block w-full p-2 mb-2 outline-blue-400" type="email" placeholder="Email">
                <input v-model="password" class="block w-full p-2 mb-2 outline-blue-400" type="password"
                    placeholder="Password">
                <button class="w-full bg-blue-400 text-white block p-2 rounded-sm" @click.prevent="register">{{
                    loginOrRegister == "register" ? "Register" : "Login" }}</button>
                <p v-if="loginOrRegister == 'register'" @click="setLoginOrRegister('login')"
                    class="text-center mt-2 cursor-pointer">Already a Member? Login here</p>
                <p v-else @click="setLoginOrRegister('register')" class="text-center mt-2 cursor-pointer">Create Account</p>
            </form>
        </div>
    </div>
</template>
