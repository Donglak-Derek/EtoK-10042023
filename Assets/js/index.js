// Declaring variables for local and remote streams, usernames, and the peerconnection
let localStream;
let username;
let remoteUser;
let remoteStream;
let sendChannel;
var msgInput = document.querySelector("#msg-input");
var msgSendBtn = document.querySelector(".msg-send-button");
var chatTextArea = document.querySelector(".chat-text-area");

// Parsing the current URL to get the "username" and "remoteUser" from the URL parameters.
let url = new URL(window.location.href);
username = url.searchParams.get("username");
remoteUser = url.searchParams.get("remoteuser");

let peerConnection;

// Initializing the video and audio stream and creating the offer.
let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  // Set the local video element's source to the obtained local stream.
  document.getElementById("user-1").srcObject = localStream;

  // Initiate the process to create the webRTC offer.
  createOffer();
};

init();

// Establishing a connection to the socket.io server
let socket = io.connect();

// Emitting a 'userconnect' event upon successfully connectiong to the Socket.io server.
socket.on("connect", () => {
  if (socket.connected) {
    socket.emit("userconnect", {
      displayName: username,
    });
  }
});

// STUN servers configuration for webRTC
let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

// Creating the RTCPeerConnection and setting up the required event handlers.
let createPeerConnection = async () => {
  // Creating a new peer connection
  peerConnection = new RTCPeerConnection(servers);

  // Setting up a new media stream for the remote user.
  remoteStream = new MediaStream();

  // Setting the video element's source for the remote user.
  document.getElementById("user-2").srcObject = remoteStream;

  // Adding tracks from the local stream to the peer connection.
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // Handling the 'ontrack' event when remote tracks are received.
  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  // Handling the inactivity of the remote stream.
  // Disabling all tracks and closing the connection when the remote stream becomes inactive.
  remoteStream.oninactive = () => {
    remoteStream.getTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
    peerConnection.close();
  };

  // Handling the 'onicecandidate' event. Emitting the candidate to the other peer via the server.
  peerConnection.onicecandidate = async (event) => {
    // console.log("Local ICE Candidate:", event.candidate);
    if (event.candidate) {
      socket.emit("candidateSentToUser", {
        username: username,
        remoteUser: remoteUser,
        iceCandidateData: event.candidate,
      });
    }
  };

  sendChannel = peerConnection.createDataChannel("sandDataChannel");
  sendChannel.onopen = () => {
    console.log("Data channel is now open and ready to use");
    onSendChannelStateChange();
  };
  peerConnection.ondatachannel = receiveChannelCallback;
  // sendChannel.onmessage = onSendChannelMessageCallBack;
};

function sendData() {
  const msgData = msgInput.value;
  chatTextArea.innerHTML +=
    "<div style='margin-top:2px; margin-bottom:2px;'><b>Me: </b>" +
    msgData +
    "</div>";
  if (sendChannel) {
    onSendChannelStateChange();
    sendChannel.send(msgData);
    msgInput.value = "";
  } else {
    receiveChannel.send(msgData);
  }
}

function receiveChannelCallback(event) {
  console.log("Receive Channel Callback");
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallBack;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallBack(event) {
  console.log("Receive Message");
  chatTextArea.innerHTML +=
    "<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger: </b>" +
    event.data +
    "</div>";
}
function onReceiveChannelStateChange() {
  const readystate = receiveChannel.readystate;
  console.log("Receive Channel state is: " + readystate);
  if (readystate === "open") {
    console.log(
      "Data channel ready state is open - onReceiveChannelStateChange"
    );
  } else {
    console.log(
      "Data channel ready state is NOT open - onReceiveChannelStateChange"
    );
  }
}

function onSendChannelStateChange() {
  const readystate = sendChannel.readystate;
  console.log("Send channel state is: " + readystate);
  if (readystate === "open") {
    console.log("Data channel ready state is open - onSendChannelStateChange");
  } else {
    console.log(
      "Data channel ready state is NOT open - onSendChannelStateChange"
    );
  }
}

// Creating and sending an offer to the remote user.
let createOffer = async () => {
  createPeerConnection();
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offerSentToRemote", {
    username: username,
    remoteUser: remoteUser,
    offer: peerConnection.localDescription,
  });
};

// Creating an answer in response to an offer received from the remote user.
let createAnswer = async (data) => {
  remoteUser = data.remoteUser;
  createPeerConnection();
  await peerConnection.setRemoteDescription(data.offer);
  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answerSentToUser1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.username,
  });
};

// Handling the 'ReceiveOffer' event. Creating an answer when an offer is received.
socket.on("ReceiveOffer", function (data) {
  createAnswer(data);
});

// Setting the remote description when an answer is received.
let addAnswer = async (data) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
};

// Handling the 'ReceiveAnswer' event.
socket.on("ReceiveAnswer", function (data) {
  addAnswer(data);
});

// Adding the received ice candidate to the peer connection.
socket.on("candidateReceiver", function (data) {
  peerConnection.addIceCandidate(data.iceCandidateData);
});

msgSendBtn.addEventListener("click", function (event) {
  sendData();
});
