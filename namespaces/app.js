const io = require('socket.io-client');

let socket = io.connect('http://localhost:3010');

let room = 'Java';

socket.on('connect', ()=>{
    socket.emit('new_room', room);    
});

socket.on('new_message', (data)=>{
    console.log(`Incoming message: ${data}`);    
});