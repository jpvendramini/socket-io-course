const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3010;

app.get('/', function(req, res) {
    res.sendFile(__dirname+'/index.html')
});

io.on('connect', socket=>{
    console.log('User connected');

    socket.on('message', ({message, room})=>{
        socket.join(room);
        io.in(room).emit('new_message', message);
        console.log(`${message} from the room ${room}`);
    });

    socket.on('disconnect', data=>{
        console.log('User disconnected...');
    })
});

http.listen(port,()=>{console.log(`Server is listening on localhost:${port}`)});