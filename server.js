require('dotenv').config();
const express = require("express");
const app = express();
const User = require("./User")
var bodyParser = require("body-parser")
const server = require("http").Server(app)
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}
app.use(bodyParser.urlencoded({ extended: true }));
const { Configuration, OpenAIApi } = require("openai");
const config = new Configuration({
  organization: process.env.OPENAI_ORG,
  apiKey: process.env.OPENAI_KEY,
});
const openai = new OpenAIApi(config);

// Define a function to send a message to the GPT chatbot and return the response
async function sendMessageToChatbot(message) {
  if(!message.includes("@ChatGPT")) return;
  // Remove the "Chat GPT" prefix from the message
  message = message.replace("@ChatGPT", "");
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: `Hey give me a response for this : ${message}`,
    max_tokens: 150,
    temperature: 0.5,
    top_p: 1.0,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
  });
  console.log(response.data.choices[0].text);
  return response.data.choices[0].text.trim();
}
// sendMessageToChatbot("Hello how are you?");

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });


app.get("/", function (req, res) {
    res.render("register");
});
  
// Handling user signup
app.post("/register", async (req, res) => {
  
  const user = await User.create({
    username: req.body.username,
    password: req.body.password
  });
  console.log(user)
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(()=>{
      socket.broadcast.to(roomId).emit("user-connected", userId);
    }, 1000)
    socket.on("message", async (message) => {
      io.to(roomId).emit("createMessage", message, userName);
      if(message.includes("@ChatGPT")){
        const response = await sendMessageToChatbot(message); // Send message to the chatbot
        io.to(roomId).emit("createMessage", response, "Chatbot"); // Send the chatbot's response to the room
      }
    });
  });
});



const uri = "mongodb+srv://admin:admin1234@cluster0.uhp24dd.mongodb.net/?retryWrites=true&w=majority";
const mongoose = require('mongoose')

mongoose.connect( uri)
.then(()=>{
    console.log("Connected to the Database.");
})
.catch(err => {
    console.log(err);
});

server.listen( 3030);