const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const {Server} = require('socket.io');

const app = express();

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

const sslServer = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    },
    app
);

const io = new Server(sslServer);

io.on('connection',(socket, req)=>{
    socket.emit('welcome','Welcome to the websocket server!!');
    socket.on('message',(msg)=>{
        console.log('Message from user: '+msg);
    });
});


sslServer.listen(3443, ()=>{console.log('Listening on port 3443');});