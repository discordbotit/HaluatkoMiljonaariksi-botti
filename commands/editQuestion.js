const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../models/questions.js"); //Viitataan malliin users.js

module.exports.run = async (bot, message, args) => {
     
        //Etsii tietokannan kokoelmasta "questiondatas" dokumentin, jonka id määritellään laittamalla numero komennon perään, numeron jälkeen kirjoitettu sana korvaa vastaus2:ssa olleen tiedon
        Data.findOneAndUpdate({kysymysid: args[0]},{vastaus2 : args[1]},(err, data) => {
            if(err){
                console.log(err)
            }
            if(!data) {
                return message.reply("Ei löytynyt tietokannasta kysymystä antamallasi id:llä!");
            } else {
                return message.reply(`Muutettiin tietokannan kysymystä, jonka id on ${args[0]}`);
            }
        })
    
} 


//komento toimii näillä sanoilla   
module.exports.help = {
    name: "edit_question",
    aliases: []
}