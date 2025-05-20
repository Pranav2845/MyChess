const express = require('express');
const socket = require('socket.io');
const {Chess} = require('chess.js');
const path = require('path');

const http = require('http');
const app = express();
const server = http.createServer(app);   // create server between express and http
const io = socket(server);   // real time communication

const chess = new Chess();   // chess.js instance
let players = {};   // players object to store player data
let currentPlayer = "w";

app.set('view engine', 'ejs');   // set view engine to ejs (open- notion)
app.use(express.static(path.join(__dirname, 'public')));   // serve static files from public directory (open- notion)

app.get('/', (req, res) => {   // render index.ejs file
    res.render('index', { title: "Chess Game"});
});   // render index.ejs file with players object

io.on('connection', function(uniquesocket) {   // when a player connects
    console.log("connected");   // log to console when a player connects

    if(!players['white']) {   // if there is no white player
        players['white'] = uniquesocket.id;   // assign white player to socket id
        uniquesocket.emit('playerRole', 'w');   // emit player event to white player
    }
    else if(!players['black']) {   // if there is no black player
        players['black'] = uniquesocket.id;   // assign black player to socket id
        uniquesocket.emit('playerRole', 'b');   // emit player event to black player
    } else {
        uniquesocket.emit('spectatorRole');   
    }   

    uniquesocket.on('disconnect', () => {   // when a player disconnects
        if(uniquesocket.id === players['white']) {   // if white player disconnects
            delete players['white'];   // delete white player from players object
        }
        else if(uniquesocket.id === players['black']) {   // if black player disconnects
            delete players['black'];   // delete black player from players object
        }
    });

    uniquesocket.on('move', (move) => {   // when a player makes a move
        try{
            if(chess.turn() === 'w' && uniquesocket.id != players['white']) return;  // if white player makes a move and it is not white player's turn, return
            if(chess.turn() === 'b' && uniquesocket.id != players['black']) return;  // if black player makes a move and it is not black player's turn, return

            const result = chess.move(move);   // make the move
            if(result){
                currentPlayer = chess.turn();   // set current player to the turn of the chess instance
                io.emit('move', move);   // emit move to all players
                io.emit('boardState', chess.fen());   // emit board state to all players
            }
            else{
                console.log("Invalid Move");   // log invalid move to console
                uniquesocket.emit('invalidMove', move);   // emit invalid move to player
            }
        }
        catch(err){
            console.log(err);   // log error to console
            uniquesocket.emit('invalidMove', move);   // emit invalid move to player
        }
    });
});


server.listen(3000, () => {   // listen on port 3000
    console.log('Server is running on port 3000');   // log to console when server is running
});   // listen on port 3000        