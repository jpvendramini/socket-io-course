const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

const mysql = require('mysql');

const PORT = 80;

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
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${userId}";`)
        .on('result',(data)=>{            
            db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
            FROM user
            INNER JOIN message
            ON user.idUser = message.idUser
            WHERE message.idUser LIKE "%${data.idUser}%"`).on('result',(data)=>{
                socket.join(data.idUser);
                io.in(data.idUser).emit('messagesFromUser', data);                 
            });
        });
    });

    socket.on('getAllMessages', userId=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${userId}";`)
        .on('result',(data)=>{
            db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
            FROM user
            INNER JOIN message
            ON user.idUser = message.idUser
            WHERE message.idUser LIKE "%${data.idUser}%"`).on('result',(data)=>{
                socket.join(data.idUser);
                io.in(data.idUser).emit('getAllMessages', data);
            }); 
        });
    });

    //FUNÇÃO QUE RETORNA O CLIENTE, SUA ÚLTIMA MENSAGEM, HORÁRIO E LASTSEEM
    socket.on('getUsers', ()=>{
        db.query(`SELECT * FROM user`)
        .on('result', (data)=>{
            db.query(`SELECT message.*,
            user.nome FROM message left join user on user.idUser = message.idUser
            Where message.idUser= "${data.idUser}"
            order by message.time DESC LIMIT 1`)
            .on('result', (data)=>{
                io.emit('getUsers', data);
            });
        });
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

    socket.on('update-last-seem', (idUser)=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${idUser}";`)
        .on('result', (data)=>{
            dbUpdateLastSeem(data.idUser);
            db.query(`SELECT message.content, message.seem FROM message
            WHERE message.idUser = '${data.idUser}'
            ORDER BY message.idMessage DESC
            LIMIT 1;`).on('result',(data)=>{
                socket.emit('get-last-message', data);
                showMessages();                               
            });
        });
    });

    socket.on('get out', (usuario)=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${usuario}";`)
        .on('result', (userId)=>{
            socket.leave(userId.idUser);
        });
    });

    /********************** Rooms Socket Io ***************************/
    socket.on('new_message', ({room, data})=>{        
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${room}";`)
        .on('result', (userId)=>{
            db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
            VALUES(${userId.idUser},"${data._msg}",'${data._tipoBalao}','${data._time}',${data._seem})`);
            socket.join(userId.idUser);            
            io.in(userId.idUser).emit('new_message', (data)); //enviar apenas para room do usuário
            /* Refresh users */      
            if(data._tipoBalao != 'balaoUser'){
                showMessages();
            }
        });
    });
});

server.listen(PORT, ()=>{console.log(`Listening on *${PORT}`)});

process.on('uncaughtException',(reason,p)=>{
    console.error(reason, 'Unhandled Rejection at Promise', p);
})
.on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
});
process.on('SIGTERM',(res)=>{
    console.log(res);
});


function showMessages(){
    db.query(`SELECT * FROM user`)
    .on('result', (data)=>{
        db.query(`SELECT message.*,
        user.nome FROM message left join user on user.idUser = message.idUser
        Where message.idUser= "${data.idUser}"
        order by message.time DESC LIMIT 1`)
        .on('result', (data)=>{
            io.emit('getUsers', data);
        });
    });
}


/********************DATABASE CONNECTION MYSQL*********************/
db = mysql.createConnection({
    host: '162.215.215.98',
    port: 3306,
    user: 'usercalc',
    password:'&Lu#PI&%nkpI',    
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
    });
};


//Get the last message so that the user can see It in the list of Users
dbGetLastMessage = (idUser)=>{
    db.query(`SELECT message.content, message.seem FROM message
    WHERE message.idUser = '${idUser}'
    ORDER BY message.idMessage DESC
    LIMIT 1;`).on('result',(data)=>{        
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