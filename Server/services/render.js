exports.homeRoutes = (req, res) => {
  res.render("index");
};

exports.videoChat = (req, res) => {
  res.render("video-chat");
};

exports.textChat = (req, res) => {
  res.render("text-chat");
};
