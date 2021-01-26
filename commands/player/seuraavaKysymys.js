const mongoose = require("mongoose"); // Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); // Määritellään botin asetukset JSON-tiedostosta
const Discord = require('discord.js');

mongoose.set('useFindAndModify', false);

// Yhdistetään MongoDB:hen
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

// FUNKTIOT----------------------------------------------------------------------------------------------------------------------------------
// Tällä funktiolla saadaan esitettyä vastausvaihtoehdot random-järjestyksessä, ottaa vastaan väärien vastausten arrayn ja oikean vastauksen
function shuffleAnswers(new_array, answer) {
  
    // Lisää taulukkoon oikean vastauksen
    new_array.push(answer);
    let currentIndex = new_array.length, temporaryValue, randomIndex;
  
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
    // Palauttaa sekoitetun uuden arrayn (jossa siis on kaikki vastausvaihtoehdot)
    return new_array;
}

const Data1 = require("../../models/players.js"); // Viitataan malliin players.js
const Data2 = require("../../models/easy_questions.js"); // Viitataan malliin easy_questions.js
const Data3 = require("../../models/medium_questions.js"); // Viitataan malliin medium.js
const Data4 = require("../../models/hard_questions.js"); // Viitataan malliin hard_questions.js

// Tällä funktiolla luodaan lista poistettavista kysymyksistä
function fifty_fifty(answers, message, correct_answer, Data) {

    let answers_to_be_removed = [];
  
    while (answers_to_be_removed.length < 2) {
  
        randomIndex = Math.floor(Math.random() * answers.length);
    
        if (answers[randomIndex] !== correct_answer && !answers_to_be_removed.includes(randomIndex)) {
          answers_to_be_removed.push(randomIndex);
        }
    };

    
    // 50-50 poistuu käytössä olevien oljenkorsien listalta
    Data.findOneAndUpdate({pelaajan_id: message.author.id}, {$pull: {kayttamattomat_oljenkorret: {$in: [ "50-50" ]}}}, (err, data) => {
        if (err) {
            console.log(err)
        } 
    })
  
    return answers_to_be_removed;
};

// FUNKTIOT LOPPU----------------------------------------------------------------------------------------------------------------------------------

module.exports.run = async (bot, message, args) => {

// Moduulin funktiot----------------------------------------------------------------------------------------------------------------------------------    
    // Funktio kysymys-kytkimen resetointiin ja voittoilmoitus
    function reset_kysymys_kytkin_ja_voittoilmoitus(Data, palkintosumma) {

        Data.findOneAndUpdate({pelaajan_id: message.author.id}, {kysymys_kytkin : false}, (err, data) => {
            if (err) {
                console.log(err)
            } 
        })

        Data1.findOneAndUpdate({pelaajan_id: message.author.id}, {voitot : palkintosumma}, (err, data) => {
            if (err) {
                console.log(err)
            } else if (palkintosumma === 1000000) {
                reset_game(Data,palkintosumma);
                message.reply("Onneksi olkoon, voitit pelin!");
            } else {
                message.reply(`Aivan oikein! Voitit juuri ${palkintosumma}€. Komennolla !seuraava voit aloittaa seuraavaan kysymyksen.`);
            }
        })
    };

    // Funktio käyttäjän pelitietojen resetointiin
    function reset_game(Data, palkintosumma) {

        // Reset peli_kaynnissa
        Data.findOneAndUpdate({pelaajan_id: message.author.id}, {peli_kaynnissa : false}, (err, data) => {
            if (err) {
                console.log(err)
            } 
        })
        
        // Reset kysymys_kytkin
        Data.findOneAndUpdate({pelaajan_id: message.author.id}, {kysymys_kytkin : false}, (err, data) => {
            if (err) {
                console.log(err)
            } 
        })

        // Reset voitot
        Data.findOneAndUpdate({pelaajan_id: message.author.id}, {voitot : 0}, (err, data) => {
            if (err) {
                console.log(err)
            } 
        })

        // 50-50 poistuu käytössä olevien oljenkorsien listalta
        Data.findOneAndUpdate({pelaajan_id: message.author.id}, {$push: {kayttamattomat_oljenkorret: [ "50-50" ]}}, (err, data) => {
            if (err) {
                console.log(err)
            } 
        })

        if (palkintosumma !== 1000000) {
        message.reply(`Tämä on valitettavasti väärä vastaus. Hävisit pelin.`);
        }
    };

// Moduulin funktiot loppu----------------------------------------------------------------------------------------------------------------------------------

    let oljenkorsi = false;

    // Etsitään olemassa olevaa dokumenttia
    Data1.findOne ({
        pelaajan_id: message.author.id // Etsitään dokumentti ID:n perusteella, HUOM. pitää olla databasessa numerona (ei String)!

    }, (err, data) => {

        if (data.kysymys_kytkin === true) {
            return message.reply("Et voi käyttää uusia pelikomentoja, ennen kuin olet vastannut edelliseen kysymykseen!").catch(err => console.log(err));
        }
        if (!data) {
            return message.reply("Hupsista! Tietojasi ei löytynyt, et ole vielä saanut peliroolia.").catch(err => console.log(err));
        }

        // "data" viittaa dokumentin sisällä olevaan tietoon
        else if (data.peli_kaynnissa === false) {
            return message.reply("Sinulla ei ole käynnissä olevaa peliä, aloita uusi peli !haluan_miljonääriksi komennolla.").catch(err => console.log(err));
        } 
        else {

            if (data.kayttamattomat_oljenkorret.includes('50-50')) {
                oljenkorsi = true;
            } else {
                oljenkorsi = false;
            }

            // Asetetaan kysymyskytkin trueksi, jotta pelaaja ei voi pyytää botilta uusia kysymyksiä ennen kuin päällä olevaan on vastattu
            Data1.findOneAndUpdate({pelaajan_id: message.author.id},{kysymys_kytkin : true},(err, data) => {
                if (err) {
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
                   
            // Luetaan kaikkien easy-kategorian dokumenttien lukumäärä
            Data2.countDocuments().exec(function (err, count) {

                // Määritetään random numero, jolla valitaan dokumentti 
                const random = Math.floor(Math.random() * count);
      
                // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
                Data2.findOne().skip(random).exec(
                function (err, data) {
    
                // Laitetaan dokumentin vastaukset funktiolle, joka muodostaa niistä random järjestyksessä olevan arrayn
                let answers = shuffleAnswers(data.incorrect_answers,data.correct_answer); 
                
                // Luodaan filtteri, joka sallii vain tietyillä emojeilla reagoinnin ja ainoastaan komennon kirjoittajan reagoinnit lasketaan
                const filter = (reaction, user) => ["🇦","🇧","🇨","🇩","❓"].includes(reaction.emoji.name) && user.id === message.author.id;
    
                // Kysymyspohja
                const exampleEmbed = new Discord.MessageEmbed()
                .attachFiles(['assets/bot_icon.jpg'])
                .setThumbnail('attachment://bot_icon.jpg')
                .setDescription(`Category: ${data.category}`)
                .setColor('#0099ff')
                .setTitle(data.question)
                .setAuthor('Question 1')
                .addFields({name: 'A)', value: answers[0]},
                        {name: 'B)', value: answers[1]},
                        {name: 'C)', value: answers[2]},
                        {name: 'D)', value: answers[3]})
                .setFooter('© Pasi Laaksonen, Yolanda Theodorakis, Antton Heinonen')
                
                // Kysymyspohjan lähetys channelille
                message.channel.send(exampleEmbed).then(async sentEmbed => {
                    
                    await sentEmbed.react("🇦")
                    await sentEmbed.react("🇧")
                    await sentEmbed.react("🇨")
                    await sentEmbed.react("🇩")

                    if (oljenkorsi) {
                        await sentEmbed.react("❓")
                    }

                    // Funktio, joka määrittää, mitä eri reagoinneista tapahtuu
                    function cases() {

                        // Asetuksia reaktioille, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                        sentEmbed.awaitReactions(filter, {
                            max: 1,
                         // time: 30000,
                            errors: ['time'] 
                         }).then(collected => {
                        
                             // Asetetaan switch-caset eri reagoinneille
                             const reaction = collected.first();
                        
                             switch (reaction.emoji.name) {
                                 case '🇦':
                                     
                                     if (answers[0] === data.correct_answer) {

                                        reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)

                                     } else {

                                        reset_game(Data1)
                                     }
                                     break;
                                 case '🇧':
                                     if (answers[1] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇨':
                                     if (answers[2] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇩':
                                     if (answers[3] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;                 
                             }
                         })
                        }
                // Asetuksia "❓" reaktiolle, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                sentEmbed.awaitReactions(filter, {
                    max: 1,
                    // time: 30000,
                    errors: ['time'] 
                    }).then(collected => {
                    
                    const reaction = collected.first();

                // Mitä tapahtuu, jos reagoi "❓"    
                if (reaction.emoji.name === "❓") {
                    
                    // Funktio valitsee randomisti kaksi väärää vastausta, jotka poistetaan
                    let poistettavat = fifty_fifty(answers,message,data.correct_answer,Data1)
                    // 50-50 poistuu käytössä olevien oljenkorsien listalta
                    Data1.findOneAndUpdate({pelaajan_id: message.author.id}, {$pull: {kayttamattomat_oljenkorret: {$in: [ "50-50" ]}} }, (err, data) => {
                        if (err) {
                            console.log(err)
                        } 
                    })
                    message.reply("Poistettiin kaksi väärää vastausvaihtoehtoa.")
                   
                    // Käydään läpi poistolista ja suoritetaan poisto
                    for (let i = 0; i <= 1; i++) {
                        if (poistettavat[i] === 0) {
                            sentEmbed.reactions.cache.get('🇦').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 1) {
                            sentEmbed.reactions.cache.get('🇧').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 2) {
                            sentEmbed.reactions.cache.get('🇨').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 3) {
                            sentEmbed.reactions.cache.get('🇩').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        }
                    }
                    cases();
                }})

                cases();

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
              
            // Luetaan kaikkien medium-kategorian dokumenttien lukumäärä
            Data3.countDocuments().exec(function (err, count) {

                // Määritetään random numero, jolla valitaan dokumentti 
                const random = Math.floor(Math.random() * count);
      
                // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
                Data3.findOne().skip(random).exec(
                function (err, data) {
    
                // Laitetaan dokumentin vastaukset funktiolle, joka muodostaa niistä random järjestyksessä olevan arrayn
                let answers = shuffleAnswers(data.incorrect_answers,data.correct_answer); 
                
                // Luodaan filtteri, joka sallii vain tietyillä emojeilla reagoinnin ja ainoastaan komennon kirjoittajan reagoinnit lasketaan
                const filter = (reaction, user) => ["🇦","🇧","🇨","🇩","❓"].includes(reaction.emoji.name) && user.id === message.author.id;
    
                // Kysymyspohja
                const exampleEmbed = new Discord.MessageEmbed()
                .attachFiles(['assets/bot_icon.jpg'])
                .setThumbnail('attachment://bot_icon.jpg')
                .setDescription(`Category: ${data.category}`)
                .setColor('#0099ff')
                .setTitle(data.question)
                .setAuthor('Question 1')
                .addFields({name: 'A)', value: answers[0]},
                        {name: 'B)', value: answers[1]},
                        {name: 'C)', value: answers[2]},
                        {name: 'D)', value: answers[3]})
                .setFooter('© Pasi Laaksonen, Yolanda Theodorakis, Antton Heinonen')
                
                // Kysymyspohjan lähetys channelille
                message.channel.send(exampleEmbed).then(async sentEmbed => {
                    
                    await sentEmbed.react("🇦")
                    await sentEmbed.react("🇧")
                    await sentEmbed.react("🇨")
                    await sentEmbed.react("🇩")

                    if (oljenkorsi) {
                        await sentEmbed.react("❓")
                    }

                    // Funktio, joka määrittää, mitä eri reagoinneista tapahtuu
                    function cases() {

                        // Asetuksia reaktioille, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                        sentEmbed.awaitReactions(filter, {
                            max: 1,
                         // time: 30000,
                            errors: ['time'] 
                         }).then(collected => {
                        
                             // Asetetaan switch-caset eri reagoinneille
                             const reaction = collected.first();
                        
                             switch (reaction.emoji.name) {
                                 case '🇦':
                                     
                                     if (answers[0] === data.correct_answer) {

                                        reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)

                                     } else {

                                        reset_game(Data1)
                                     }
                                     break;
                                 case '🇧':
                                     if (answers[1] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇨':
                                     if (answers[2] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇩':
                                     if (answers[3] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;                 
                             }
                         })
                        }

                // Asetuksia "❓" reaktiolle, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                sentEmbed.awaitReactions(filter, {
                    max: 1,
                    // time: 30000,
                    errors: ['time'] 
                    }).then(collected => {
                    
                    const reaction = collected.first();

                // Mitä tapahtuu, jos reagoi "❓"    
                if (reaction.emoji.name === "❓") {
                    
                    // Funktio valitsee randomisti kaksi väärää vastausta, jotka poistetaan
                    let poistettavat = fifty_fifty(answers,message,data.correct_answer,Data1)
                    // 50-50 poistuu käytössä olevien oljenkorsien listalta
                    Data1.findOneAndUpdate({pelaajan_id: message.author.id}, { $pull: { kayttamattomat_oljenkorret: { $in: [ "50-50" ] }} }, (err, data) => {
                        if(err){
                            console.log(err)
                        } 
                    })
                    message.reply("Poistettiin kaksi väärää vastausvaihtoehtoa.")
                   
                    // Käydään läpi poistolista ja suoritetaan poisto
                    for (let i = 0; i <= 1; i++) {
                        if (poistettavat[i] === 0) {
                            sentEmbed.reactions.cache.get('🇦').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 1) {
                            sentEmbed.reactions.cache.get('🇧').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 2) {
                            sentEmbed.reactions.cache.get('🇨').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 3) {
                            sentEmbed.reactions.cache.get('🇩').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        }
                    }
                    cases();
                }})

                cases();
                    
                });
                })
            }) 

            } if (data.voitot >= 10000) {

                console.log(`${data.pelaajan_id} aloitti seuraavan hard-kategorian kysymyksen.`)

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
              
            // Luetaan kaikkien hard-kategorian dokumenttien lukumäärä
            Data4.countDocuments().exec(function (err, count) {

                // Määritetään random numero, jolla valitaan dokumentti 
                const random = Math.floor(Math.random() * count);
      
                // Luetaan taas dokumentit, mutta skipataan kaikki muut paitsi "random"-luvun mukainen, tämä dokumentti menee botin antamaksi kysymykseksi
                Data4.findOne().skip(random).exec(
                function (err, data) {
    
                //Laitetaan dokumentin vastaukset funktiolle, joka muodostaa niistä random järjestyksessä olevan arrayn
                let answers = shuffleAnswers(data.incorrect_answers,data.correct_answer); 
                
                // Luodaan filtteri, joka sallii vain tietyillä emojeilla reagoinnin ja ainoastaan komennon kirjoittajan reagoinnit lasketaan
                const filter = (reaction, user) => ["🇦","🇧","🇨","🇩","❓"].includes(reaction.emoji.name) && user.id === message.author.id;
    
                // Kysymyspohja
                const exampleEmbed = new Discord.MessageEmbed()
                .attachFiles(['assets/bot_icon.jpg'])
                .setThumbnail('attachment://bot_icon.jpg')
                .setDescription(`Category: ${data.category}`)
                .setColor('#0099ff')
                .setTitle(data.question)
                .setAuthor('Question 1')
                .addFields({name: 'A)', value: answers[0]},
                        {name: 'B)', value: answers[1]},
                        {name: 'C)', value: answers[2]},
                        {name: 'D)', value: answers[3]})
                .setFooter('© Pasi Laaksonen, Yolanda Theodorakis, Antton Heinonen')
                
                // Kysymyspohjan lähetys channelille
                message.channel.send(exampleEmbed).then(async sentEmbed => {
                    
                    await sentEmbed.react("🇦")
                    await sentEmbed.react("🇧")
                    await sentEmbed.react("🇨")
                    await sentEmbed.react("🇩")

                    if (oljenkorsi) {
                        await sentEmbed.react("❓")
                    }

                    // Funktio, joka määrittää, mitä eri reagoinneista tapahtuu
                    function cases() {

                        // Asetuksia reaktioille, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                        sentEmbed.awaitReactions(filter, {
                            max: 1,
                         // time: 30000,
                            errors: ['time'] 
                         }).then(collected => {
                        
                             // Asetetaan switch-caset eri reagoinneille
                             const reaction = collected.first();
                        
                             switch (reaction.emoji.name) {
                                 case '🇦':
                                     
                                     if (answers[0] === data.correct_answer) {

                                        reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)

                                     } else {

                                        reset_game(Data1)
                                     }
                                     break;
                                 case '🇧':
                                     if (answers[1] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇨':
                                     if (answers[2] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;
                                 case '🇩':
                                     if (answers[3] === data.correct_answer) {

                                         reset_kysymys_kytkin_ja_voittoilmoitus(Data1,palkintosumma)
                                         
                                     } else {

                                         reset_game(Data1)
                                     }
                                     break;                 
                             }
                         })
                        }

                // Asetuksia "❓" reaktiolle, esim. vain yksi reagointi lasketaan (max : 1) ja myös voidaan asettaa vastausaika
                sentEmbed.awaitReactions(filter, {
                    max: 1,
                 // time: 30000,
                    errors: ['time'] 
                    }).then(collected => {
                    
                    const reaction = collected.first();
                    
                // Mitä tapahtuu, jos reagoi "❓"    
                if (reaction.emoji.name === "❓") {
                    
                    //Funktio valitsee randomisti kaksi väärää vastausta, jotka poistetaan
                    let poistettavat = fifty_fifty(answers,message,data.correct_answer,Data1)
                    //50-50 poistuu käytössä olevien oljenkorsien listalta
                    Data1.findOneAndUpdate({pelaajan_id: message.author.id}, { $pull: { kayttamattomat_oljenkorret: { $in: [ "50-50" ] }} }, (err, data) => {
                        if(err){
                            console.log(err)
                        } 
                    })
                    message.reply("Poistettiin kaksi väärää vastausvaihtoehtoa.")
                   
                    // Käydään läpi poistolista ja suoritetaan poisto
                    for (let i = 0; i <= 1; i++) {
                        if (poistettavat[i] === 0) {
                            sentEmbed.reactions.cache.get('🇦').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 1) {
                            sentEmbed.reactions.cache.get('🇧').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 2) {
                            sentEmbed.reactions.cache.get('🇨').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        } if (poistettavat[i] === 3) {
                            sentEmbed.reactions.cache.get('🇩').remove().catch(error => console.error('Failed to remove reactions: ', error)); 
                        }
                    }
                    cases();
                }})

                cases();
    
                });
                })
            }) 
            }
            }
        }  
    )
}


// Komento toimii näillä sanoilla   
module.exports.help = {
    name: "seuraava",
    aliases: []
}
