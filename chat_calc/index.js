const db = require('./database');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

db.db();
// db.dbInsertUser('Rafael');

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

io.on('connection',(socket)=>{    
    console.log('User connected!');
    socket.on('disconnect',()=>{
        console.log('User disconnected...');
    });    
});

server.listen(9000, ()=>{console.log('Listening on *9000')});