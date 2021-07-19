const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const mysql = require('mysql');

app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/index.html');
});

isInitialized = false;
io.on('connection',(socket)=>{    
    console.log('User connected!');
    socket.on('disconnect',()=>{
        console.log('User disconnected...');
    });    
    if(!isInitialized){
        db.query('SELECT * FROM user')
        .on('result', (data)=>{                    
            socket.emit('currentUsers', data);
        });            
    }
    socket.on('getMessages',(userId)=>{
        db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
        FROM user
        INNER JOIN message
        ON user.idUser = message.idUser
        WHERE message.idUser LIKE '%${userId}%'`).on('result',(data)=>{
            socket.emit('messagesFromUser', data)        
        });
    })
    socket.on('insertMessage',(msg)=>{
        console.log(msg);
    })
});

server.listen(9000, ()=>{console.log('Listening on *9000')});

//DATABASE CONNECTION
db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password:'admin123',    
    database: 'chatcalc'    
});


db.connect((error)=>{
    if(error){
        console.log(error);
    }else{
        console.log('DB connected ;)');
    }
})


//INSERÇÃO E APRESENTAÇÂOD E USUÁRIOS
dbInsertUser = (nome)=>{
    db.query(`INSERT INTO user (nome)
    SELECT * FROM(SELECT '${nome}') AS tmp
    WHERE NOT EXISTS(SELECT nome FROM user WHERE nome = '${nome}')
    LIMIT 1;`).on('result',(data)=>{
        if(data.affectedRows == 0){
            console.log('Username already taken :(');
        }else{
            console.log('User registered!!');
        }        
    });
};

dbGetUsers = ()=>{
    db.query('SELECT * FROM user').on('result', (data)=>{        
        console.log(data);
    });
};


//INSERÇÃO E APRESENTAÇÃO DE MENSAGENS
dbInsertMessage = (idUser, content, tipo, time, seem = false)=>{
    db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
    VALUES(${idUser},'${content}','${tipo}','${time}',${seem})`);
};

dbGetMessagesFromUser = (idUser)=>{
    db.query(`SELECT user.nome, message.tipo, message.content, message.time
    FROM user
    INNER JOIN message
    ON user.idUser = message.idUser
    WHERE message.idUser LIKE '%${idUser}%'`).on('result',(data)=>{
        console.log(data);
    });
};


//Get the last message so that the user can see It in the list of Users
dbGetLastMessage = (idUser)=>{
    db.query(`SELECT message.content, message.seem FROM message
    WHERE message.idUser = '${idUser}'
    ORDER BY message.idMessage DESC
    LIMIT 1;`).on('result',(data)=>{
        console.log(data);
    })
};

//For notifing that there are messages not read by the client
dbUpdateLastSeem = (idUser)=>{
    db.query(`UPDATE message
    SET message.seem = true
    WHERE message.idUser = '${idUser}';`);
};