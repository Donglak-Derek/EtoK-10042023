let localStream;
let username;
let remoteUser;
let url = new URL(window.location.href);
username = url.searchParams.get("username");
remoteUser = url.searchParams.get("remoteUser");

let peerConnection;
let init = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  document.getElementById("user-1").srcObject = localStream;
  createOffer();
};

init();

let socket = io.connect();

socket.on("connect", () => {
  if (socket.connected) {
    socket.emit("userconnect", {
      displayName: username,
    });
  }
});

let servers = {
  iceServers: [
    {
      urls: ["stun:stun1.1.google.com:19302", "stun:stun2.1.google.com:19302"],
    },
  ],
};

let createOffer = async () => {
  peerConnection = new RTCPeerConnection(servers);
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offerSentToRemote", {
    username: username,
    remoteUser: remoteUser,
    offer: peerConnection.localDescription,
  });
};
let createAnswer = async (data) => {
  remoteUser = data.remoteUser;

  peerConnection = new RTCPeerConnection(servers);
  await peerConnection.setRemoteDescription(data.offer);
  let answer = await peerConnection.createAnswer();

  socket.emit("answerSentToUser1", {
    answer: answer,
    sender: data.remoteUser,
    receiver: data.username,
  });
};

socket.on("ReceiverOffer", function (data) {
  createAnswer(data);
});

let addAnswer = async (data) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(data.answer);
  }
};

socket.on("ReceiverAnswer", function (data) {
  addAnswer(data);
});
