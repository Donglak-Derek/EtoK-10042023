const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

app.use(bodyParser.json());

app.set("view engine", "ejs");

app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "Assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));

app.use("/", require("./Server/routes/router.js"));

var server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const io = require("socket.io")(server, {
  allowEI03: true, // False by default
});

var userConnection = [];

io.on("connection", (socket) => {
  console.log("Socket id: ", socket.id);

  socket.on("userconnect", (data) => {
    userConnection.push({
      connectionId: socket.id,
      user_id: data.displayName,
    });
    var userCount = userConnection.length;
    console.log("Logged in username: ", data.displayName);
    console.log("userCount", userCount);
  });

  socket.on("offerSentToRemote", (data) => {
    var offerReceiver = userConnection.find(
      (o) => o.user_id === data.remoteUser
    );
    if (offerReceiver) {
      console.log("OfferReceiver user is:", offerReceiver.connectionId);
      socket.to(offerReceiver.connectionId).emit("ReceiverOffer", data);
    }
  });

  socket.on("answerSentToUser1", (data) => {
    var answerReceiver = userConnection.find(
      (o) => o.user_id === data.receiver
    );

    if (answerReceiver) {
      console.log("AnswerReceiver user is:", answerReceiver.connectionId);
      socket.to(answerReceiver.connectionId).emit("ReceiveAnswer", data);
    }
  });
});
