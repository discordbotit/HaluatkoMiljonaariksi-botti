const mongoose = require("mongoose"); //Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); //Määritellään botin asetukset JSON-filusta
const Discord = require('discord.js');

mongoose.set('useFindAndModify', false);

//Yhdistetään MongoDB:hen:
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

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

const Data1 = require("../../models/players.js"); //Viitataan malliin players.js
const Data2 = require("../../models/easy_questions.js"); //Viitataan malliin easy_questions.js
const Data3 = require("../../models/medium_questions.js"); //Viitataan malliin medium.js
const Data4 = require("../../models/hard_questions.js"); //Viitataan malliin hard_questions.js




  module.exports.run = async (bot, message, args) => {
     
    //Etsitään olemassa olevaa dokumenttia
    Data1.findOne ({

        pelaajan_id: message.author.id //Etsitään dokumentti ID:n perusteella, HUOM. pitää olla databasessa numerona (ei String)!

    }, (err, data) => {

        if (data.kysymys_kytkin === true) {
            return message.reply("Et voi käyttää uusia pelikomentoja, ennen kuin olet vastannut edelliseen kysymykseen!").catch(err => console.log(err));
        }
        if (!data) {
            return message.reply("Hupsista! Ei löytynyt tietojasi, et ole vielä saanut peliroolia.").catch(err => console.log(err));
        }

        //"data" viittaa dokumentin sisällä olevaan tietoon
        else if (data.peli_kaynnissa === false) {

            
            return message.reply("Sinulla ei ole käynnissä olevaa peliä, aloita uusi peli !haluan_miljonääriksi komennolla!").catch(err => console.log(err));
            

        } else {

            //Asetetaan kysymyskytkin trueksi, jotta pelaaja ei voi pyytää botilta uusia kysymyksiä ennen kuin päällä olevaan on vastattu
            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : true},(err, data) => {
                if(err){
                    console.log(err)
                } 
            })

            if (data.voitot < 1000) {

                console.log(`${data.pelaajan_id} aloitti seuraavan helppo-kategorian kysymyksen`)

                var palkintosumma;
                if (data.voitot < 700) {
                    palkintosumma = data.voitot + 200;
                } else if (data.voitot === 700) {
                    palkintosumma = data.voitot + 300;
                }
              
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
                                
                                if (answers[0] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇧':
                                if (answers[1] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇨':
                                if (answers[2] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇩':
                                if (answers[3] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;                 
                        }
                    })
                });
                })
            }) 


            } if (data.voitot >= 1000 && data.voitot < 10000) {
                
                console.log(`${data.pelaajan_id} aloitti seuraavan medium-kategorian kysymyksen`)

                var palkintosumma;
                if (data.voitot < 3000) {
                    palkintosumma = data.voitot + 1000;
                } else if (data.voitot >= 3000 && data.voitot < 7000) {
                    palkintosumma = data.voitot + 2000;
                } else if (data.voitot === 7000) {
                    palkintosumma = data.voitot + 3000;
                }
              
            //Luetaan kaikkien medium-kategorian dokumenttien lukumäärä
            Data3.countDocuments().exec(function (err, count) {

                // Määritetään random numero, jolla valitaan dokumentti 
                var random = Math.floor(Math.random() * count)
      
                // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
                Data3.findOne().skip(random).exec(
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
                                
                                if (answers[0] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇧':
                                if (answers[1] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇨':
                                if (answers[2] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇩':
                                if (answers[3] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;                 
                        }
                    })
                });
                })
            }) 


            } if (data.voitot >= 10000) {


                console.log(`${data.pelaajan_id} aloitti seuraavan hard-kategorian kysymyksen`)

                var palkintosumma;
                if (data.voitot === 10000) {
                    palkintosumma = data.voitot + 5000;
                } else if (data.voitot === 15000) {
                    palkintosumma = data.voitot + 15000;
                } else if (data.voitot === 30000) {
                    palkintosumma = data.voitot + 30000;
                } else if (data.voitot === 60000) {
                    palkintosumma = data.voitot + 140000;
                } else if (data.voitot === 200000) {
                    palkintosumma = data.voitot + 800000
                }
              
            //Luetaan kaikkien hard-kategorian dokumenttien lukumäärä
            Data4.countDocuments().exec(function (err, count) {

                // Määritetään random numero, jolla valitaan dokumentti 
                var random = Math.floor(Math.random() * count)
      
                // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
                Data4.findOne().skip(random).exec(
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
                                
                                if (answers[0] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)

                                        } else if (palkintosumma === 1000000) {
                                                message.reply("Onneksi olkoon, voitit pelin! :)")
                                        Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                            if(err){
                                                console.log(err)
                                            } 
                                        })
                                        Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                            if(err){
                                                console.log(err)
                                            } 
                                        })
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇧':
                                if (answers[1] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else if (palkintosumma === 1000000) {
                                            message.reply("Onneksi olkoon, voitit pelin! :)")
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇨':
                                if (answers[2] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else if (palkintosumma === 1000000) {
                                            message.reply("Onneksi olkoon, voitit pelin! :)")
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;
                            case '🇩':
                                if (answers[3] === data.correct_answer) {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : palkintosumma},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } else if (palkintosumma === 1000000) {
                                            message.reply("Onneksi olkoon, voitit pelin! :)")
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                                if(err){
                                                    console.log(err)
                                                } 
                                            })
                                        } else {
                                            message.reply(`Aivan oikein! Sinulla on nyt koossa ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen`)
                                        }
                                    })
                                    
                                } else {
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{voitot : 0},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    Data1.findOneAndUpdate({pelaajan_id: message.author.id},{peli_kaynnissa : false},(err, data) => {
                                        if(err){
                                            console.log(err)
                                        } 
                                    })
                                    message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin`)
                                }
                                break;                 
                        }
                    })
                });
                })
            }) 
            }
            }
        }  
    )
}




//komento toimii näillä sanoilla   
module.exports.help = {
    name: "seuraava",
    aliases: []
}
