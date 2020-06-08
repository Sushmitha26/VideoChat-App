//import simple-peer package
let Peer = require('simple-peer');
//in client side js,we can't use require(), so we use watchify
let socket = io();  //directly connect to our host
const video = document.querySelector('video');  //reference to our own video
const filter = document.querySelector('#filter');
const checkboxTheme = document.querySelector('#theme');
let client = {}; //related to other person
let currentFilter;

//get video stream
//ask browser for user permission
navigator.mediaDevices.getUserMedia({video: true, audio: true}) //get video/voice stream
//if user gives permission,
.then(stream => {
    //notify backend to add one client
    socket.emit('NewClient');
    video.srcObject = stream; //Received a video stream, which can be displayed in a video tag
    video.play();

    //when u change the filter
    filter.addEventListener('change', (event) => {
        currentFilter = event.target.value;
        video.style.filter = currentFilter;  //this is for our own video
        SendFilter(currentFilter); //this is for other person
        event.preventDefault;
    });

    // initialise/define new peer and return it
    function InitPeer(type) { 
        //creating an instance of peer for new webrtc peer connection
        let peer = new Peer({initiator: (type == 'init') ? true : false, stream: stream, trickle: false});
        peer.on('stream', function(stream) {  //when we get the stream from the other user,create new video
            CreateVideo(stream);
        });

        //peer.on('close', function() {
            //document.getElementById("peerVideo").remove();
            //peer.destroy();
        //});
        //listener when any data comes,here filter value is stored in decodeddata,this is for other client
        peer.on('data', function(data) {
            let decodedData = new TextDecoder('utf-8').decode(data);  //a specific character encoding, like utf-8
            let peervideo = document.querySelector('#peerVideo');
            peervideo.style.filter = decodedData;
        })
        return peer;
    }

    function RemovePeer() {
        document.getElementById("peerVideo").remove();
        document.getElementById('muteText').remove();
        if(client.peer) {
            client.peer.destroy();
        }
    }

    //creating a peer of type init
    function MakePeer() {
        client.gotAnswer = false;//initially the ans of client is set to false,then we send offer and wait for response
        let peer = InitPeer('init');  //get peer reply back from this calling func
        peer.on('signal',function(data) {  //init type will automatically run the signal func
            if(!client.gotAnswer) {
                socket.emit('Offer', data);
            }
        });
        //if gotAnswer is true,
        client.peer = peer;
    }

    //creating a peer of type notinit, when we get answer from another client,we shd send him answer
    function FrontAnswer(offer) {
        let peer = InitPeer('notInit');
        peer.on('signal',(data) => {  //signal func won't run automatically,we have to call
            socket.emit('Answer', data);  //event is answer
        });
        peer.signal(offer);  //pass the data(here offer) from 'signal' events to remote peer and call peer.signal(data) to get connected.
        client.peer = peer;  //adding to client object
    }

    //when answer comes from backend
    function SignalAnswer(answer) {
        client.gotAnswer = true;
        let peer = client.peer;
        peer.signal(answer);  //goes to line37
    }

    function CreateVideo(stream) {
        CreateDiv();
        let video = document.createElement('video');
        video.id = "peerVideo";
        video.srcObject = stream;
        //video.class = "embed-responsive-item";
        video.setAttribute('class', 'embed-responsive-item');
        document.querySelector("#peerDiv").appendChild(video); //inside that div,video element is added as child
        video.play();
        //wait for 1 sec
        setTimeout(() => SendFilter(currentFilter), 1000);
        video.addEventListener('click', () => {
            if (video.volume != 0)
                video.volume = 0
            else
                video.volume = 1
        })
    }

    //when other person opens the url while session is going on,he shd be notified
    function SessionActive() {
        document.write('Session Active. Please come back later');
    }

    function SendFilter(filter) {
        //check if ther is another person
        if(client.peer) {
            client.peer.send(filter);  //built-in send() func
        }
    }

    socket.on('BackOffer',FrontAnswer); //when offer comes from backend
    socket.on('BackAnswer', SignalAnswer); //Hub will call this fucntion to send the answer ot the caller
    socket.on('SessionActive', SessionActive);
    socket.on('CreatePeer', MakePeer);
    socket.on('Disconnect', RemovePeer);

})
//if not,
.catch(err => document.write(err));

//npm run watch converts main.js to bundle.js

checkboxTheme.addEventListener('click', () => {
    if (checkboxTheme.checked == true) {
        document.body.style.backgroundColor = '#212529'; //black
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#fff";  //white
        }

    }
    else {
        document.body.style.backgroundColor = '#fff';
        if (document.querySelector('#muteText')) {
            document.querySelector('#muteText').style.color = "#212529";
        }
    }
});

//when video is creted,text is also dynamically created, and removed when video is removed
function CreateDiv() {
    let div = document.createElement('div');
    div.setAttribute('class', "centered");
    div.id = "muteText";
    div.innerHTML = "Click to Mute/Unmute";
    document.querySelector('#peerDiv').appendChild(div);
    if (checkboxTheme.checked == true)
        document.querySelector('#muteText').style.color = "#fff";
}


