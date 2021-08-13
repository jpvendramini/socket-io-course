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

    socket.on('joinRoom', usuario=>{
        socket.join(usuario);
    });

    socket.on('getAllMessages', (userId, usuario)=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${userId}";`)
        .on('result',(data)=>{
            db.query(`SELECT message.idMessage, user.nome, message.tipo, message.content, message.time
            FROM user
            INNER JOIN message
            ON user.idUser = message.idUser
            WHERE message.idUser LIKE "%${data.idUser}%"`).on('result',(data)=>{
                socket.join(usuario);
                io.in(usuario).emit('getAllMessages', data);
            }); 
        });
    });

    //FUNÇÃO QUE RETORNA O CLIENTE, SUA ÚLTIMA MENSAGEM, HORÁRIO E LASTSEEM
    socket.on('getUsers', (user)=>{
        db.query(`SELECT * FROM user`)
        .on('result', (data)=>{
            db.query(`SELECT message.*,
            user.nome, user.displayNome, user.phoneNumber FROM message left join user on user.idUser = message.idUser
            Where message.idUser= "${data.idUser}"
            order by message.time DESC LIMIT 1`)
            .on('result', (data)=>{
                socket.join(user)
                io.in(user).emit('getUsers', data);//Enviar mensagem para quarto do funcionário
            });
        });
    });

    socket.on('createUser', (newUser, displayNome, phoneNumber)=>{
        dbInsertUser(newUser, displayNome, phoneNumber);
        console.log(newUser, displayNome, phoneNumber);                
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

    const dados = [{email:'appcargo.joao@gmail.com'}, {email:'marcos'}, {email:'davi'}];
    
    socket.on('new_message', ({room, data})=>{     
        console.log(data);   
        db.query(`SELECT user.idUser, user.nome, user.displayNome FROM user WHERE user.nome = "${room}";`)
        .on('result', (userId)=>{
            db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
            VALUES(${userId.idUser},"${data._msg}",'${data._tipoBalao}','${data._time}',${data._seem})`);
            socket.join(userId.idUser);    
            db.query(`SELECT message.idMessage 
            FROM message WHERE message.idUser = ${userId.idUser} 
            ORDER BY message.idMessage DESC LIMIT 1;`)
            .on('result', id=>{
                // for(dado in dados){
                //     io.in(dado.email).emit('new_message', ({data, id}));
                // }
                io.in(userId.idUser).emit('new_message', ({data, id})); //enviar apenas para room do usuário
            });
            /* Send data trought database */
            if(data._tipoBalao != 'balaoUser'){
                showMessages();
            }else{
                showMessagesUser();                
            }
        });
    });

    socket.on('deleteMessage', (idMessage)=>{
        db.query(`DELETE FROM message
        WHERE message.idMessage = ${idMessage}`);        
    });

    socket.on('deleteAllMessages', (idUser)=>{
        db.query(`SELECT user.idUser FROM user WHERE user.nome = "${idUser}";`)
        .on('result', data=>{
            db.query(`DELETE FROM message
            WHERE message.idUser = ${data.idUser}`);
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
    io.emit('LIMPA ARRAY', true);
    db.query(`SELECT * FROM user`)
    .on('result', (data)=>{
        db.query(`SELECT message.*,
        user.nome, user.displayNome, user.phoneNumber FROM message left join user on user.idUser = message.idUser
        Where message.idUser= "${data.idUser}"
        order by message.time DESC LIMIT 1`)
        .on('result', (data)=>{
            io.emit('getUsers', data);
        });
    });
}

function showMessagesUser(){
    io.emit('LIMPA ARRAY', true);
    db.query(`SELECT * FROM user`)
    .on('result', (data)=>{
        db.query(`SELECT message.*,
        user.nome, user.displayNome, user.phoneNumber FROM message left join user on user.idUser = message.idUser
        Where message.idUser= "${data.idUser}"
        order by message.time DESC LIMIT 1`)
        .on('result', (data)=>{
            io.emit('getUsersUsers', data);
        });
    });
}


/********************DATABASE CONNECTION MYSQL*********************/
db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: "root",
    password:"n7WWcn2mUCItkwXs",    
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
dbInsertUser = (nome, displayNome, phoneNumber)=>{
    db.query(`INSERT INTO user (nome, displayNome, phoneNumber)
    SELECT * FROM(SELECT "${nome}", "${displayNome}", "${phoneNumber}") AS tmp
    WHERE NOT EXISTS(SELECT nome FROM user WHERE nome = "${nome}")
    LIMIT 1;`).on('result',(data)=>{
        console.log(nome + displayNome + phoneNumber);
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