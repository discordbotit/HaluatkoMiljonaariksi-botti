const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); //Määritellään botin asetukset JSON-filusta

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../../models/players.js"); //Viitataan malliin users.js


//Komennolla käyttäjä voi lopettaa olemassa olevan pelin, tämän myötä nollataan voitot ja muutetaan oleelliset kytkimet falseksi
module.exports.run = async (bot, message, args) => {

    Data.findOne ({

        pelaajan_id: message.author.id // Etsitään dokumentti ID:n perusteella, HUOM. pitää olla databasessa numerona, ei stringinä

    }, (err, data) => {

        //Jossei ole peliä käynnissä, tästä mainitaan
        if (data.peli_kaynnissa === false) {
            return message.reply("Sinulla ei ole käynnissä olevaa peliä").catch(err => console.log(err));
        } else {
            
            Data.findOneAndUpdate({pelaajan_id: message.author.id}, {peli_kaynnissa : false}, (err, data) => {
                if(err){
                    console.log(err)
                } 
            })
            
            Data.findOneAndUpdate({pelaajan_id: message.author.id}, {kysymys_kytkin : false}, (err, data) => {
                if(err){
                    console.log(err)
                } 
            })
        
            Data.findOneAndUpdate({pelaajan_id: message.author.id}, {voitot : 0}, (err, data) => {
                if(err){
                    console.log(err)
                } 
            })
        
            //Jos 50-50 oljenkorsi käytettiin pelissä, lisätään se resetoinnin yhteydessä käytössä olevien oljenkorsien listalle takaisin
            if (!data.kayttamattomat_oljenkorret.includes('50-50')) {
                Data.findOneAndUpdate({pelaajan_id: message.author.id}, { $push: { kayttamattomat_oljenkorret: [ "50-50" ] } }, (err, data) => {
                    if(err){
                        console.log(err)
                    } 
                })
            }
        
            message.reply("Lopetit pelin.")
        }
    });
    
}


//komento toimii näillä sanoilla   
module.exports.help = {
name: "lopeta",
aliases: []
}
