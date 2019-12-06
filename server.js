/* eslint-disable import/no-absolute-path */
/* eslint-disable import/no-unresolved */
const express = require('express');
const path = require('path');
var db = require("./models");
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let rooms = 0;

app.use(express.static('public'));

require("./routes/htmlRoutes.js")(app);
require("./routes/user-api-routes.js")(app);

db.sequelize.sync({ force: false }).then(function () {

  io.on('connection', (socket) => {
    // Create a new game room and notify the creator of game.
    socket.once('createGame', (data) => {
      socket.join(`room-${++rooms}`);
      socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
    });

    // Connect the Player 2 to the room he requested. Show error if room full.
    socket.once('joinGame', (data) => {
      const room = io.nsps['/'].adapter.rooms[data.room];
      if (room && room.length === 1) {
        socket.join(data.room);
        socket.broadcast.to(data.room).emit('player1', {});
        socket.emit('player2', { name: data.name, room: data.room });
      }
    });

    socket.on('playTurn', (data) => {

      socket.broadcast.to(data.room).emit('turnPlayed',
        {
          playerOneAttack: data.playerOneAttack,
          playerTwoAttack: data.playerTwoAttack,
          characterTwoHp: data.characterTwoHp,
          characterTwoName: data.characterTwoName,
          characterOneHp: data.characterOneHp,
          characterOneName: data.characterOneName
        });
    });

    socket.on('endGame', (data) => {
      socket.broadcast.to(data.room);
    });
  });

  server.listen(process.env.PORT || 8080, function () {
    console.log(
      "🌎 Listening on port 8080. Visit http://localhost:8080/ in your browser."
    );
  });

})



