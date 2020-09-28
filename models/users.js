const mongoose = require("mongoose");

//Dokumentin rakenteen määrittely:
const dataSchema = mongoose.Schema({
    user1: String,
    userID1: Number,
})

//Malli luo tietokantaan "playerdata(s)" kokoelman
module.exports = mongoose.model("playerData", dataSchema);