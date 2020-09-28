const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../models/users.js"); //Viitataan malliin users.js

module.exports.run = async (bot, message, args) => {
     
        //Uusi dokumentti
        const newData = new Data({
            user1: args[0],
            userID1: 1,     
    })
    newData.save().catch(err => console.log(err));  //Dokumentin tallennus tietokantaan
    
} 


//komento toimii näillä sanoilla   
module.exports.help = {
    name: "new_player",
    aliases: []
}

