const mongoose = require("mongoose");


//Dokumentin rakenteen määrittely:
const uusiSchema = mongoose.Schema({
    kysymys: String,
    kysymysid: Number,
    vastaus1: String,
    vastaus2: String,
    vastaus3: String,
    vastaus4: String,
})

//Malli luo tietokantaan "questiondata(s)" kokoelman
module.exports = mongoose.model("questionData", uusiSchema);