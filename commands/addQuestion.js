const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../models/questions.js"); //Viitataan malliin questions.js

module.exports.run = async (bot, message, args) => {

    //Uuden dokumentin luonti
    const newData = new Data({
        kysymys: "Mikä on Suomen pääkaupunki?",
        kysymysid: 1,
        vastaus1: "Helsinki",
        vastaus2: "Oslo",
        vastaus3: "Tallinna",
        vastaus4: "Moskova",
        })
        newData.save().catch(err => console.log(err)); //Dokumentin tallennus tietokantaan

} 
    
//komento toimii näillä sanoilla   
module.exports.help = {
    name: "add_question",
    aliases: []
}

