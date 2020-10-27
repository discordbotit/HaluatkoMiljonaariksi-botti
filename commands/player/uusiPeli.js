const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); //Määritellään botin asetukset JSON-filusta
const Discord = require('discord.js');

mongoose.set('useFindAndModify', false);

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data1 = require("../../models/players.js"); //Viitataan malliin players.js
const Data2 = require("../../models/easy_questions.js"); //Viitataan malliin easy_questions.js

//Tällä funktiolla saadaan esitettyä vastausvaihtoehdot random-järjestyksessä, ottaa vastaan väärien vastausten arrayn ja oikean vastauksen
function shuffleAnswers(new_array,answer) {
  
    //Lisää taulukkoon oikean vastauksen
    new_array.push(answer) 
    var currentIndex = new_array.length, temporaryValue, randomIndex;
  
    // Toistetaan niin kauan kun arrayssa on elementtejä sekoitettavana
    while (0 !== currentIndex) {
  
      // Poimii jäljelle jääneen elementin
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // Vaihdetaan sen paikka randomindeksillä
      temporaryValue = new_array[currentIndex];
      new_array[currentIndex] = new_array[randomIndex];
      new_array[randomIndex] = temporaryValue;
    }
    //Palauttaa sekoitetun uuden arrayn (jossa siis on kaikki vastausvaihtoehdot)
    return new_array;
  }

module.exports.run = async (bot, message, args) => {
     
     //Etsitään olemassa olevaa dokumenttia
    Data1.findOne ({

        pelaajan_id: message.author.id //Etsitään dokumentti ID:n perusteella, HUOM. pitää olla databasessa numerona (ei String)!

    }, (err, data) => {

        //Tarkistetaan, onko kysymyskytkin päällä
        //Jos tällaista ominaisuutta ei tarkistettaisi, voisi käyttäjä pyytää uuden kysymyksen kesken edellistä ja peli menisi ihan sekaisin
        if (data.kysymys_kytkin === true) {
            return message.reply("Et voi käyttää uusia pelikomentoja, ennen kuin olet vastannut edelliseen kysymykseen!").catch(err => console.log(err));
        }
        //"data" viittaa dokumentin sisällä olevaan tietoon
        if (data.peli_kaynnissa === true) {

            
            return message.reply("Sinulla on jo käynnissä oleva peli, käytä komentoa !seuraava saadaksesi uuden kysymyksen!").catch(err => console.log(err));
            

        } else {
            
            //Asetetaan kysymyskytkin trueksi, jotta pelaaja ei voi pyytää botilta uusia kysymyksiä ennen kuin päällä olevaan on vastattu
            //Kun kysymykseen on vastattu, kytkin menee jälleen offille ja pelaajan on mahdollista pyytää uusi kysymys
            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : true},(err, data) => {
                if(err){
                    console.log(err)
                } 
            })

            console.log(`${data.pelaajan_id} aloitti uuden pelin`)

            //Kun uusi peli aloitetaan, muutetaan tietokantaan pelaajakohtaisia tietoja "peli_käynnissä -> true ja voitot nollataan"
            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : true},(err, data) => {
                if(err){
                    console.log(err)
                } else {
                    console.log(`Muutettiin pelaajan ${data.pelaajan_nimi} peli status trueksi`)
                }
            })

            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                if(err){
                    console.log(err)
                } else {
                    console.log(`Nollattiin pelaajan ${data.pelaajan_nimi} voitot uuden pelin myötä`)
                }
            })
            
            
            //Luetaan kaikkien easy-kategorian dokumenttien lukumäärä
            Data2.countDocuments().exec(function (err, count) {

            // Määritetään random numero, jolla valitaan dokumentti 
            var random = Math.floor(Math.random() * count)
  
            // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
            Data2.findOne().skip(random).exec(
            function (err, data) {

            //Laitetaan dokumentin vastaukset funktiolle, joka muodostaa niistä random järjestyksessä olevan arrayn
            let answers = shuffleAnswers(data.incorrect_answers,data.correct_answer); 
            
            //Luodaan filtteri, joka sallii vain tietyillä emojeilla reagoinnin ja ainoastaan komennon kirjoittajan reagoinnit lasketaan
            const filter = (reaction, user) => ["🇦","🇧","🇨","🇩"].includes(reaction.emoji.name) && user.id === message.author.id;

            // Kysymyspohja
            const exampleEmbed = new Discord.MessageEmbed()
            .setDescription(`Category: ${data.category}`)
            .setColor('#0099ff')
            .setTitle(data.question)
            .setURL('https://discord.js.org/')
            .setAuthor('Question 1')
            .setThumbnail('https://i.imgur.com/wSTFkRM.png')
            .addFields(
                { name: 'A)', value: answers[0]},
                { name: 'B)', value: answers[1]},
                { name: 'C)', value: answers[2]},
                { name: 'D)', value: answers[3]},
            )
            
            .setImage('https://i.imgur.com/wSTFkRM.png')
            
            //Kysymyspohjan lähetys channelille
            message.channel.send(exampleEmbed).then(async sentEmbed => {
                
                await sentEmbed.react("🇦")
                await sentEmbed.react("🇧")
                await sentEmbed.react("🇨")
                await sentEmbed.react("🇩")

                //Asetuksia reaktioille, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                sentEmbed.awaitReactions(filter, {
                   max: 1,
                //    time: 30000,
                   errors: ['time'] 
                }).then(collected => {

                    //Asetetaan switch-caset eri reagoinneille
                    const reaction = collected.first();

                    switch (reaction.emoji.name) {
                        case '🇦':
                            //Jos valinta vastaa oikeaa vastausta, lisätään pelaajan voittoihin 100€
                            //Jos valinta on väärä, peli on ohi ja voitot nollataan
                            if (answers[0] === data.correct_answer) {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 100},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply("Aivan oikein! Voitit juuri 100€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen")
                                    }
                                })
                                
                            } else {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                    }
                                })
                            }
                            break;
                        case '🇧':
                            if (answers[1] === data.correct_answer) {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 100},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        
                                        message.reply("Aivan oikein! Voitit juuri 100€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen")
                                    }
                                })
                                
                            } else {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                    }
                                })
                            }
                            break;
                        case '🇨':
                            if (answers[2] === data.correct_answer) {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 100},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply("Aivan oikein! Voitit juuri 100€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen")
                                    }
                                })
                                
                            } else {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                    }
                                })
                            }
                            break;
                        case '🇩':
                            if (answers[3] === data.correct_answer) {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 100},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply("Aivan oikein! Voitit juuri 100€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen")
                                    }
                                })
                                
                            } else {
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } 
                                })
                                Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                    if(err){
                                        console.log(err)
                                    } else {
                                        message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                    }
                                })
                            }
                            break;                 
                    }
                })
            });
            })
        })
        }
     })
    }   


//komento toimii näillä sanoilla   
module.exports.help = {
    name: "haluan_miljonääriksi",
    aliases: []
}
