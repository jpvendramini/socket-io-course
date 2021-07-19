const mysql = require('mysql');

//DATABASE CONNECTION
db = mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password:'admin123',    
    database: 'chatcalc'    
});

exports.db = ()=>{
    db.connect((error)=>{
        if(error){
            console.log(error);
        }else{
            console.log('DB connected ;)');
        }
    })
};


//INSERÇÃO E APRESENTAÇÂOD E USUÁRIOS
exports.dbInsertUser = (nome)=>{
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

exports.dbGetUsers = ()=>{
    db.query('SELECT * FROM user').on('result', (data)=>{
        console.log(data);
    });
};


//INSERÇÃO E APRESENTAÇÃO DE MENSAGENS
exports.debInsertMessage = (idUser, content, tipo, time, seem = false)=>{
    db.query(`INSERT INTO message(idUser, content, tipo, time, seem) 
    VALUES(${idUser},'${content}','${tipo}','${time}',${seem})`);
};

exports.dbGetMessagesFromUser = (idUser)=>{
    db.query(`SELECT user.nome, message.tipo, message.content, message.time
    FROM user
    INNER JOIN message
    ON user.idUser = message.idUser
    WHERE message.idUser LIKE '%${idUser}%'`).on('result',(data)=>{
        console.log(data);
    });
};


//Get the last message so that the user can see It in the list of Users
exports.dbGetLastMessage = (idUser)=>{
    db.query(`SELECT message.content, message.seem FROM message
    WHERE message.idUser = '${idUser}'
    ORDER BY message.idMessage DESC
    LIMIT 1;`).on('result',(data)=>{
        console.log(data);
    })
};

//For notifing that there are messages not read by the client
exports.dbUpdateLastSeem = (idUser)=>{
    db.query(`UPDATE message
    SET message.seem = true
    WHERE message.idUser = '${idUser}';`);
};