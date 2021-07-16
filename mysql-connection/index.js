const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const mysql = require('mysql');
const {Server} = require('socket.io');
const io = new Server(server);

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

var db = mysql.createConnection({
    host: '192.168.15.117',
    port: 3306,
    user: 'root',
    database: 'node',
    password:'admin123',
    connectTimeout:300000 
});

db.connect((error)=>{
    if(error) {
        console.log(error);
    }else{
        console.log("DB:Connected!!");
    }
});

function sendNotes(note){
    db.query('INSERT INTO notes (note) VALUES (?)', note);        
};

var notes = [];
var isInitiated = false;

io.on('connection', (socket) => {
    console.log('Socket: User connected :)');
    socket.on('disconnect', ()=>{
        console.log('User disconnected!! :(');
        isInitiated = false;
    });    
    
    socket.on('chat message', (msg)=>{
        sendNotes(msg);
        if(!isInitiated){
            db.query('SELECT * FROM notes').on('result',(data)=>{
                io.emit('chat message', data.note);
            });
            isInitiated = true;
        }
        io.emit('chat message', msg);
    });
});


server.listen(3000, ()=>{
    console.log('Listening on *3000');
});
