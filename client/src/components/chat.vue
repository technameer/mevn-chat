
<script setup>
import { ref, onMounted, nextTick, watch, defineEmits } from "vue"
import avatar from "./avatar.vue";
import axios from "axios"
const emit = defineEmits(["logout"])
const props = defineProps({ email: String })

const ws = ref("")
const onlinePeople = ref()
const offlinePeople = ref()
const messageContainer = ref(null)
const userId = ref("")
const selfUser = ref("")
const message = ref("")
const messages = ref([])
watch(onlinePeople, async () => {
    await nextTick()
    axios.get("/people").then(res => {
        const offlinePeopleArr = res.data
            .filter(p => p._id !== selfUser.value)
            .filter(p => !Object.keys(onlinePeople.value).includes(p._id));
        console.log(onlinePeople.value)
        const offlinePeoples = {};
        offlinePeopleArr.forEach(p => {
            offlinePeoples[p._id] = p.email
        });
        offlinePeople.value = offlinePeoples
    })
})
watch(userId, (newValue) => {
    axios.get("/messages/" + newValue).then(res => {
        const messagesFromDb = res.data
        messagesFromDb.forEach(message => {
            messages.value.push(message)
        })
    })
})

function logout() {
    axios.post("/logout").then(() => {
        ws.value = null;
        emit("logout", false)
        userId.value = null;
        selfUser.value = null;
    })
}

function setSelectedUserId(newUserId) {
    userId.value = newUserId
}
function connectToWs() {
    const wss = new WebSocket("ws://localhost:8080")
    ws.value = wss;
    ws.value.addEventListener("message", handleMessage)
    ws.value.addEventListener('close', () => {
        setTimeout(() => {
            console.log('Disconnected. Trying to reconnect.');
            connectToWs();
        }, 1000);
    });
}
async function sendMessage(fileInfo = null) {
    if (message.value !== "" || fileInfo) {
        ws.value.send(JSON.stringify({ recipient: userId.value, message: message.value, file: fileInfo }))
        message.value = ''
        if (fileInfo) {
            axios.get("/messages/" + userId.value).then(res => {
                const messagesFromDb = res.data
                messages.value = messagesFromDb
                console.log(messagesFromDb)
            })
        } else {
            messages.value.push({ text: message.value, sender: selfUser.value, recipient: userId.value, id: Date.now() })
        }
        await nextTick()
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight - messageContainer.value.clientHeight;
    }

}

function handleFile(e) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(e.target.files[0])
    fileReader.onload = () => {
        sendMessage({
            name: e.target.files[0].name,
            data: fileReader.result
        })
    }
}

async function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ id, email }) => {
        people[id] = email;
    });
    onlinePeople.value = people;
    for (const key in onlinePeople.value) {
        if (onlinePeople.value.hasOwnProperty(key) && onlinePeople.value[key] === props.email) {
            selfUser.value = key
            delete onlinePeople.value[key];
            break;
        }
    }

}

async function handleMessage(e) {
    const eData = JSON.parse(e.data)
    if ("online" in eData) {
        await showOnlinePeople(eData.online)
    } else {
        messages.value.push(eData)
        await nextTick()
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight - messageContainer.value.clientHeight;

    }
}

onMounted(connectToWs)
</script>
<template>
    <div class="h-screen bg-blue-100 flex">
        <div class="bg-white w-1/3 flex flex-col">
            <div class="flex-grow">
                <div class="text-blue-400 font-bold flex gap-2 my-3 p-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>

                    Mevn-Chat
                </div>
                <div v-if="onlinePeople">
                    <div v-for="(value, key, i) in onlinePeople" @click="setSelectedUserId(key)"
                        :class="['py-2', 'border-gray-400', 'border-b ', 'flex gap-2', 'items-center', key == userId ? 'bg-blue-50' : 'nothing', 'py-3', 'pl-5', 'font-bold', 'text-gray-800']">
                        <avatar :firstLetter="onlinePeople[key][0]" :userId="key" :online="true" />
                        {{ onlinePeople[key] }}
                    </div>
                </div>
                <div v-if="offlinePeople">
                    <div v-for="(value, key, i) in offlinePeople" @click="setSelectedUserId(key)"
                        :class="['py-2', 'border-gray-400', 'border-b ', 'flex gap-2', 'items-center', key == userId ? 'bg-blue-50' : 'nothing', 'py-3', 'pl-5', 'font-bold', 'text-gray-800']">
                        <avatar :firstLetter="offlinePeople[key][0]" :userId="key" :online="false" />
                        {{ offlinePeople[key] }}
                    </div>
                </div>
            </div>
            <div class="p-2 text-center flex items-center justify-center">
                <span class="mr-2 flex items-center text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
                        <path fill-rule="evenodd"
                            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                            clip-rule="evenodd" />
                    </svg>
                    {{ props.email }}
                </span>
                <button class="text-gray-700 bg-blue-100 py-1 px-2 border rounded" @click="logout">logout</button>
            </div>
        </div>
        <div class="bg-black-500 w-2/3 mx-2 flex flex-col p-3 ">
            <div class="flex-grow flex items-center justify-center h-full text-gray-400 text-bold text-2xl"
                v-if="userId == ''">&larr; Select a user from the sidebar</div>
            <div class="flex-grow h-full overflow-y-auto" ref="messageContainer" v-else>
                <div class="font-bold text-center text-xl">Message with selected contact</div>
                <div v-for="message in messages" :key="message.id"
                    :class="[message.sender == selfUser ? 'text-right' : 'text-left', 'font-medium']">
                    <div v-if="!message.file"
                        :class="[message.sender == selfUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-600', 'p-2', 'my-1', 'inline-block', 'rounded-md',]">
                        {{ message.text }}
                    </div>
                    <div v-else
                        :class="[message.sender == selfUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-600', 'p-2', 'my-1', 'inline-block', 'rounded-md',]">
                        <a :href="axios.defaults.baseURL + '/uploads/' + message.file" target="_blank">
                            <div class="flex gap-1 justify-center items-center border-b">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                                    stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round"
                                        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                </svg>
                                {{ message.file }}
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            <form class="flex gap-2" @submit.prevent="sendMessage">
                <input type="text" v-model="message" class="flex-grow p-2 rounded-sm outline-blue-400"
                    placeholder="Enter your message here">
                <button class="bg-blue-400 p-2 text-white hover:bg-blue-600 relative">
                    <input type="file" @change="handleFile" class="opacity-0 inset-0 w-full h-full absolute" />
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                    </svg>
                </button>
                <button type="submit" class="text-white rounded-sm bg-blue-400 p-2 hover:bg-blue-600"><svg
                        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                        stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                </button>
            </form>
        </div>
    </div>
</template>

