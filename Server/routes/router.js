const express = require("express");
const route = express.Router();

const services = require("../services/render");

route.get("/", services.homeRoutes);

route.get("/video-chat", services.videoChat);

route.get("/text-chat", services.textChat);

module.exports = route;
