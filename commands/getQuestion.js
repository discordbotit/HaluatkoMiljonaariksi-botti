const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../models/questions.js"); //Viitataan malliin questions.js

module.exports.run = async (bot, message, args) => {
    
    //Etsitään olemassa olevaa dokumenttia
    Data.findOne ({
        kysymysid: 1
    }, (err, data) => {
        //"data" viittaa dokumentin sisällä olevaan tietoon
        if (!data) {
            return message.reply("Ei löydy kysymystä tällaisella id:llä!").catch(err => console.log(err));
        } else {
            return message.reply(`Kysymykseen "${data.kysymys}" vastaus on "${data.vastaus1}"`);
        }
     })
    }
 
//komento toimii näillä sanoilla    
module.exports.help = {
    name: "testi",
    aliases: []
}