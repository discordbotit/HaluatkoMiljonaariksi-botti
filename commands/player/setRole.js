const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../../models/players.js"); //Viitataan malliin users.js

module.exports.run = async (bot, message, args) => {

    if(message.member.roles.cache.find(r => r.name === 'Haluatko miljonääriksi')) {
        return(message.reply("Sinulla on jo tämä rooli!"))
    }

    let role = message.guild.roles.cache.find(r => r.name === 'Haluatko miljonääriksi')
    let user = message.guild.members.cache.get(message.author.id);
    user.roles.add(role);

    const newData = new Data({
        pelaajan_nimi: message.author.username,
        pelaajan_id: message.author.id,
        peli_kaynnissa: false,
        kysymys_kytkin: false,
        voitot: 0,
        kayttamattomat_oljenkorret: ['50-50','kilauta kaverille','kysy katsomolta']
        })
        newData.save().catch(err => console.log(err)); //Dokumentin tallennus tietokantaan
        message.reply("Sinulla on nyt rooli ja voit aloittaa pelaamisen!")
    }

    
//komento toimii näillä sanoilla   
module.exports.help = {
    name: "pelaaja",
    aliases: []
}