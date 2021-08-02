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

    socket.on('send-chat-id',({userId})=>{        
        console.log(`UserId ${userId}`);       
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${userId}";`)
        .on('result',(data)=>{
            console.log('That is the user ID: ' + data.idUser);
            db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
            FROM user
            INNER JOIN message
            ON user.idUser = message.idUser
            WHERE message.idUser LIKE "%${data.idUser}%"`).on('result',(data)=>{
                socket.join(data.idUser);
                io.in(data.idUser).emit('messagesFromUser', data); 
                console.log(data);
            });
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


    socket.on('join', (room)=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${room}";`)
        .on('result',(data)=>{
            socket.join(data.idUser);
        });
    });


    socket.on('get-users',()=>{
        db.query('SELECT * FROM user').on('result', data=>{                ;        
            socket.emit('get-users', data);
        });
    });


    socket.emit('greetings', 'Greetings from the server side!!');

    socket.on('get-last-message', (user)=>{
        db.query(`SELECT message.content, message.seem FROM message
        WHERE message.idUser = '${user}'
        ORDER BY message.idMessage DESC
        LIMIT 1;`).on('result',(data)=>{
            socket.emit('get-last-message', data)            
        })
    });
        

    /********************** Rooms Socket Io ***************************/
    socket.on('new_message', ({room, data})=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${room}";`)
        .on('result', (userId)=>{
            db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
            VALUES(${userId.idUser},"${data._msg}",'${data._tipoBalao}','${data._time}',false)`);            
            socket.join(userId.idUser);
            console.log(`${data._msg} from the room ${userId.idUser}`);        
            io.in(userId.idUser).emit('new_message', (data));            
        });
    });
});

server.listen(9000, ()=>{console.log('Listening on *9000')});



/********************DATABASE CONNECTION MYSQL*********************/
db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password:'12345',    
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
    db.query('SELECT * FROM user');
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