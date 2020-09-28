const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../models/users.js"); //Viitataan malliin users.js

module.exports.run = async (bot, message, args) => {
     
         //Etsii tietokannan kokoelmasta "playerdatas" dokumentin ja poistaa annetulla idllä pelaajan tietokannasta
        Data.findOneAndRemove({userID1: args[0]}, (err, data) => {
            if(err){
                console.log(err)
            }
            if(!data) {
                return message.reply("Ei löytynyt tietokannasta käyttäjää antamallasi id:llä!");
            } else {
                return message.reply(`Poistettiin tietokannasta käyttäjä id:llä ${args[0]}`);
            }
        })
    
} 


//komento toimii näillä sanoilla   
module.exports.help = {
    name: "remove_player",
    aliases: []
}