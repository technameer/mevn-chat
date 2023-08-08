require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const ws = require("ws")
const fs = require("fs")
const Message = require("./models/message")

mongoose.connect('mongodb://127.0.0.1:27017/chat-app')
const salt = bcrypt.genSaltSync()

const user = require("./models/userModel")
const app = express()
app.use('/uploads', express.static(__dirname + '/uploads'));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });

}


app.use(cors({
    credentials: true,
    origin: "http://localhost:5173"
}))
app.use(cookieParser())
app.use(express.json())

app.get("/people",async (req,res)=>{
    const people = await user.find()
    res.send(people)
})

app.get("/profile", (req, res) => {
    const token = req.cookies?.token
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
            if (err) throw err
            res.send(userData)
        })
    } else {
        res.status(401).json("no token")
    }
})

app.get("/messages/:userId", async (req, res) => {
    const { userId } = req.params
    const userData = await getUserDataFromRequest(req)
    const ourId = userData.id
    const messages = await Message.find({
        sender : {$in : [userId,ourId]},
        recipient : {$in : [userId,ourId]}
    }).sort({createdAt : 1})
    res.send(messages)
})
app.post("/logout",(req,res)=>{
    res
    .cookie("token", "", { sameSite: "none", secure: true })
    .status(200)
    .json("ok");
})

app.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        const hashedPass = await bcrypt.hash(password, salt)
        const User = await user.create({
            email,
            password: hashedPass
        });
        jwt.sign({ id: User._id, email: User.email }, process.env.JWT_SECRET, {}, (err, token) => {
            if (err) { throw err }
            res
                .cookie("token", token, { sameSite: "none", secure: true })
                .status(200)
                .json({
                    id: User._id,
                    email
                });
        });
    } catch (e) {
        res.status(400).send(e)
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const User = await user.findOne({
            email
        });

        if (User) {
            const isMatch = await bcrypt.compare(password, User.password)
            if (isMatch) {
                jwt.sign({ id: User._id, email: User.email }, process.env.JWT_SECRET, {}, (err, token) => {
                    if (err) { throw err }
                    res
                        .cookie("token", token, { sameSite: "none", secure: true })
                        .status(200)
                        .json({
                            id: User._id,
                            email
                        });
                });
            }
            else {
                res.status(401).send("incorrect credentials")
            }
        }
        else {
            res.status(400).send("user not found")
        }
    } catch (e) {
        res.status(400).send(e)
    }
});

const server = app.listen(8080, () => {
    console.log("listening at port 8080")
})

const wss = new ws.WebSocketServer({ server })
wss.on("connection", (connection, req) => {

    function notifyAboutOnlinePeople(){
            [...wss.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...wss.clients].map(c => ({ id: c.id, email: c.email })),
        }));
    });
    }

    connection.pingTimer = setInterval(() => {
        connection.ping()
        connection.deathTimer = setTimeout(() => {
            clearInterval(connection.pingTimer)
            connection.terminate()
            notifyAboutOnlinePeople()
        }, 1000);
    }, 5000);

    connection.on("pong",()=>{
        clearTimeout(connection.deathTimer)
    })

    const cookies = req.headers.cookie
    if (cookies) {
        const tokenCookie = cookies.split(';').find(str => str.trim().startsWith("token"))
        if (tokenCookie) {
            const token = tokenCookie.split("=")[1]
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET, {}, (err, userData) => {
                    connection.id = userData.id
                    connection.email = userData.email
                })
            }
        }
    }
    notifyAboutOnlinePeople() 

    connection.on("message", async (e) => {
        const messageData = JSON.parse(e.toString())
        const { recipient, message,file } = messageData
        let filename = null
        if(file){
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1]; 
            filename = Date.now() + "." + ext;
            const path = __dirname + "/uploads/" + filename;
            const bufferData = new Buffer.from(file.data.split(',')[1], 'base64');
            fs.writeFile(path,bufferData,()=>{
                console.log("file saved at path"+path)
            })
        }
        if (recipient && (message || file)) {
            const newMessage = await Message.create({
                sender: connection.id,
                recipient,
                text: message,
                file: file ? filename:null
            });
            [...wss.clients]
                .filter(c => c.id === recipient)
                .forEach((c) => { c.send(JSON.stringify({ sender: connection.id, recipient, text: message,file: file ? filename:null })) });
        }

    })
})