const express = require('express');
const path = require('path');
const fetch = require("node-fetch");
const app = express();
const WebSocket = require('ws');
var fs = require('fs');
var files = fs.readdirSync('screams/');
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
const port = 8765;
app.listen(port, () => {
  console.log(`listening http://localhost:${port}`);
});
const socketServer = new WebSocket.Server({port: 3030});

const url = "https://api.giphy.com/v1/gifs/random?api_key=Qv3h2IWU87lkdBEy7C7Gw4JCw5BkGZF0&tag=shout";
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

  socketClient.on('message', async (json) => {
    if (json === 'null') {
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({count: socketServer.clients.size}));
            }
        });
        return;
    }
    const { message, user_id } = JSON.parse(json);
    if (message !== "null") {
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({message: message, user_id: user_id}));
            }
        });
    } else {
        const random_file_name = files[Math.floor(Math.random() * files.length)];
        const { data } = await getGif();
        socketServer.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({audio: random_file_name, gif: data.image_url, user_id: user_id}));
            }
        });
    }
  });

  socketClient.on('close', (socketClient) => {
    socketServer.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({count: socketServer.clients.size}));
        }
    });
  });
});