// Importing neccessary libraries/modules
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");

// Initializing the express application
const app = express();

const dotenv = require("dotenv");
const connectDB = require("./Server/database/connection");

dotenv.config({ path: "config.env" });
// Setting up the port, using the environment variable PORT if it's available, else 8080
const PORT = process.env.PORT || 8080;

connectDB();

// Middleware to parse incoming request bodies with urlencoded payloads
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to parse incoming request bodies with a JSON payload
app.use(bodyParser.json());

// Setting up EJS (Embedded JavaScript) as the view engine for the Express application
app.set("view engine", "ejs");

// Serving static assets like CSS, images. and JS from the Assets directory
app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "Assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));

// Using; the router middleware from the router.js file for the root path
app.use("/", require("./Server/routes/router.js"));

// Starting the Express server and listening on the specified port
var server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Initiating Socket.io on the running server
const io = require("socket.io")(server, {
  allowEI03: true, // This allows older Socket.io v3 clients to connect to the server
});

// An array to hold details of users connected to the server
var userConnection = [];

// Event listner for when a new client connects to the Socket.io server
io.on("connection", (socket) => {
  console.log("Socket id: ", socket.id);

  // Event listener for a custom event named "userconnect"
  socket.on("userconnect", (data) => {
    userConnection.push({
      connectionId: socket.id,
      user_id: data.displayName,
    });
    var userCount = userConnection.length;
    console.log("Logged in username: ", data.displayName);
    console.log("userCount", userCount);
  });

  // Event listener for a custom event when a user sends an offer to a remote user
  socket.on("offerSentToRemote", (data) => {
    var offerReceiver = userConnection.find(
      (o) => o.user_id === data.remoteUser
    );
    if (offerReceiver) {
      console.log("OfferReceiver user is:", offerReceiver.connectionId);
      socket.to(offerReceiver.connectionId).emit("ReceiveOffer", data);
    }
  });

  // Event listener for when an answer is sent to the initiator of the connection
  socket.on("answerSentToUser1", (data) => {
    var answerReceiver = userConnection.find(
      (o) => o.user_id === data.receiver
    );

    if (answerReceiver) {
      console.log("AnswerReceiver user is:", answerReceiver.connectionId);
      socket.to(answerReceiver.connectionId).emit("ReceiveAnswer", data);
    }
  });

  // Event listener for when a candidate information (ICE Candidate) is sent to another user
  socket.on("candidateSentToUser", (data) => {
    // console.log(
    //   "Received candidate from:",
    //   data.username,
    //   "for:",
    //   data.remoteUser
    // );

    var candidateReceiver = userConnection.find(
      (o) => o.user_id === data.remoteUser
    );
    // console.log("candidateReceiver", candidateReceiver);
    if (candidateReceiver) {
      console.log("candidateReceiver user is:", candidateReceiver.connectionId);
      socket.to(candidateReceiver.connectionId).emit("candidateReceiver", data);
    }
  });

  // Event listener for when a user disconnects from the Socket.io server
  socket.on("disconnect", () => {
    console.log("User disconnected from server");
    var disUser = userConnection.find((p) => p.connectionId === socket.id);
    if (disUser) {
      userConnection = userConnection.filter(
        (p) => p.connectionId !== socket.id
      );
      console.log(
        "Rest users username are: ",
        userConnection.map((user) => user.user_id)
      );
    }
  });
});
