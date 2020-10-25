const mongoose = require("mongoose");

//Dokumentin rakenteen määrittely:
const dataSchema = mongoose.Schema({
    pelaajan_nimi: String,
    pelaajan_id: Number,
    peli_kaynnissa: Boolean,
    kysymys_kytkin: Boolean,
    voitot: Number,
    kayttamattomat_oljenkorret: Array,
})

//Malli luo tietokantaan "playerdata(s)" kokoelman
module.exports = mongoose.model("playersData", dataSchema);
