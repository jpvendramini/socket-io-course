const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const mysql = require('mysql');
const {Server} = require('socket.io');
const io = new Server(server);

//Quando entrarmos na porta vigiado pelo socket, seremos direcionados a esse arquivo html
app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

//CONEXÂO COM O MYSQL
var db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password:'admin123',    
    database: 'chatcalc'    
});

db.connect((error)=>{
    if(error) {
        console.log(error);
    }else{
        console.log("DB:Connected!!");
    }    
});
//CONEXÂO COM O MYSQL - FIM

function sendNotes(userId, content, time){    
    var values = [[userId,content, time]];
    db.query("INSERT INTO mensagem(idMessage, content, time) VALUES ?;", [values]);
};

var isInitiated = false;

//SOCKET IO
io.on('connection', (socket) => {
    console.log('Socket: User connected :)');
    if(!isInitiated){
        db.query("SELECT usuarios.nome, mensagem.content, mensagem.time FROM usuarios INNER JOIN mensagem ON usuarios.idUser = mensagem.idMessage WHERE mensagem.idMessage LIKE '%123%';")
        .on('result',(data)=>{
            io.emit('chat message', data.content, data.time);
        });
        isInitiated = true;
    }
    
    socket.on('disconnect', ()=>{
        console.log('User disconnected!! :(');
        isInitiated = false;
    });    
    
    socket.on('chat message', (msg, time)=>{
        sendNotes(123,msg,time);

        io.emit('chat message', msg, time);
    });
});
//SOCKET IO - FIM


server.listen(3000, ()=>{
    console.log('Listening on *3000');
});
