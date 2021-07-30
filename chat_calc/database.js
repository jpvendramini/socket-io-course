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
        isInitiated = false;
    });

    socket.on('send-chat-id',({room, userId})=>{        
        console.log(`UserId ${userId}`);        
        db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
        FROM user
        INNER JOIN message
        ON user.idUser = message.idUser
        WHERE message.idUser LIKE "%${userId}%"`).on('result',(data)=>{
            socket.join(userId);
            io.in(userId).emit('messagesFromUser', data); 
            console.log(data);
        });
    });

    socket.on('insertMessage',(msg)=>{
        dbInsertMessage(msg._id, msg._msg, msg._tipoBalao, msg._time);
        io.emit('new-chat-messages', msg);
        console.log(msg);
    });

    socket.on('createUser', (newUser)=>{
        dbInsertUser(newUser);
        console.log(newUser);
    });

    socket.on('getUserId', (username)=>{
        db.query(`SELECT user.idUser FROM user
        WHERE user.nome = "${username}";`).on('result',(data)=>{
            socket.emit('getUserId', data);
        });
    });

    socket.on('verifyUsers', user=>{
        db.query(`SELECT user.nome FROM user 
        WHERE user.nome = "${user}";`).on('result', data=>{
            socket.emit('verifyUsers', data);            
            console.log(data);
        });
    });

    /********************** Rooms Socket Io ***************************/
    socket.on('new_message', ({room, msg})=>{
        dbInsertMessage(msg._id, msg._msg, msg._tipoBalao, msg._time);
        socket.join(room);
        io.in(room).emit('new_message', msg);
        console.log(`${msg._msg} from the room ${room}`);        
    });
});

server.listen(9000, ()=>{console.log('Listening on *9000')});



/********************DATABASE CONNECTION MYSQL*********************/
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


//Inserir novo usuário (é verificado se ele já está cadastrado)
dbInsertUser = (nome)=>{
    db.query(`INSERT INTO user (nome)
    SELECT * FROM(SELECT "${nome}") AS tmp
    WHERE NOT EXISTS(SELECT nome FROM user WHERE nome = "${nome}")
    LIMIT 1;`).on('result',(data)=>{
        if(data.affectedRows == 0){
            var repetido = `"${nome}#"`;
            db.query(`INSERT INTO user (nome) VALUES(${repetido})`);            
            console.log('Username already taken :(');
            return 0;
        }else{    
            console.log('User registered!!');
            return 1;
        }        
    });
};

//Apresentar todos funcionários
dbGetUsers = ()=>{
    db.query('SELECT * FROM user').on('result', (data)=>{        
        console.log(data);
    });
};


//Inserir mensagens
dbInsertMessage = (idUser, content, tipo, time, seem = false)=>{
    db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
    VALUES(${idUser},"${content}",'${tipo}','${time}',${seem})`);
};

//Apresentar mensagens
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

//Encontrar id do usuário
dbGetUserId = (nome)=>{
    return db.query(`SELECT user.idUser FROM user
    WHERE user.nome = ${nome};`);
};