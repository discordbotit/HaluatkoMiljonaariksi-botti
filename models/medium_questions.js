const mongoose = require("mongoose");

// Dokumentin rakenteen määrittely
const uusiSchema = mongoose.Schema({
    category: String,
    type: String,
    difficulty: String,
    question: String,
    correct_answer: String,
    incorrect_answers: Array,
});

// Malli luo tietokantaan "medium_questionData(s)" kokoelman
module.exports = mongoose.model("medium_questionData", uusiSchema);
