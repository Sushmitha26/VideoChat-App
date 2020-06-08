const express = require('express');
const app = express();
//app=require('express')();
const http = require('http').Server(app); //supply app to server
//create an instance pf socket.io by passing http
const io = require('socket.io')(http);
const port = process.env.PORT || 3000; //either 3000 or port available

//load static files
app.use(express.static(__dirname + "/public"));
let clients = 0;

io.on('connection', function(socket) {
    socket.on('NewClient', function() {
        if(clients < 2) {
            if(clients == 1) {
                this.emit('CreatePeer'); //this particular socket runs the createpeer event which will run MakePeer func which sends the offer to first client
            }
        }
        else {
            this.emit('SessionActive');
        }
        clients++;
    })
    //when offer comes from front-end,sendoffer will handle that
    socket.on('Offer',SendOffer);
    //when ans is coming,send ans to other user
    socket.on('Answer',SendAnswer);
    //when we close window
    socket.on('disconnect', Disconnect);
})

function Disconnect() {
    if (clients > 0) {
        if (clients <= 2)
            this.broadcast.emit("Disconnect");//when one person disconnected,ask other person to remove video by sending event Disconnect to front end main.js
        clients--;
    }
}

//data sent from main.js is offer parameter here,send offer to other user
function SendOffer(offer) {
    this.broadcast.emit('BackOffer', offer); //send to other users but not to us, backoffer is event name
}

function SendAnswer(data) {
    this.broadcast.emit('BackAnswer', data); 
}

http.listen(port, () => console.log(`Active on ${port} port`));

