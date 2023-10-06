const mongoose = require("mongoose");
var UserDB = require("../model/model");

exports.create = (req, res) => {
  const user = new UserDB({
    active: "yes",
    status: "0",
  });
};

user
  .save(user)
  .then((data) => {
    res.send(data._id);
  })
  .catch((err) => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while creating a create operation",
    });
  });

exports.leavingUserUpdate = (req, res) => {
  const userid = req.params.id;
  console.log("Leaving userid is", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "no", status: "0" } })
    .then((data) => {
      if (data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found`,
        });
      } else {
        res.send(" 1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error Update user information" });
    });
};

exports.newUserUpdate = (req, res) => {
  const userid = req.params.id;
  console.log("new Update userid is", userid);

  UserDB.updateOne({ _id: userid }, { $set: { active: "yes" } })
    .then((data) => {
      if (data) {
        res.status(404).send({
          message: `Cannot update user with ${userid} Maybe user not found`,
        });
      } else {
        res.send(" 1 document updated");
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Error Update user information" });
    });
};
