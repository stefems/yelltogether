const express = require('express');
const path = require('path');
const fetch = require("node-fetch");
const socketIO = require('socket.io');
const WebSocket = require('ws');
var fs = require('fs');
var files = fs.readdirSync('screams/');
const port = process.env.PORT || 8765;

const server = express()
.use(express.static('public'))
.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
})
.listen(port, () => {
  console.log(`listening http://localhost:${port}`);
});
const socketServer = socketIO(server);

const token = process.env.giphy || require('./.env').giphy;

const url = `https://api.giphy.com/v1/gifs/random?api_key=${token}&tag=shout`;
const getGif = async () => {
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.log(error);
    }
};
socketServer.on('connection', (socketClient) => {
  socketClient.on('disconnect', function() { 
    socketServer.emit('message', JSON.stringify({count: socketServer.engine.clientsCount}));
  });
  socketServer.emit('message', JSON.stringify({count: socketServer.engine.clientsCount}));
  socketClient.on('message', async (json) => {
    const { user_id, message } = JSON.parse(json);
    if (message !== "null") {
      socketServer.emit('message', JSON.stringify({message: message, user_id: user_id}));
    } else {
        const random_file_name = files[Math.floor(Math.random() * files.length)];
        const { data } = await getGif();
        socketServer.emit('message', JSON.stringify({audio: random_file_name, gif: data.image_url, user_id: user_id}));
    }
  });
});