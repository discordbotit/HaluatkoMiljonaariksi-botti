const Discord = require('discord.js'); 
const bot = new Discord.Client({disableEveryone: true}); 
const botsettings = require('./botconfig.json') 
const fs = require("fs");

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

//LUKEE KOMENNOT-TIEDOSTON
fs.readdir("./commands/", (err, files) => {
   if(err) console.log(err);
   
   let jsfile = files.filter(f => f.split(".").pop() === "js");
   if(jsfile.length <= 0){
       return console.log("No commands found!"); 
   }
   jsfile.forEach((f) => {
        let props = require(`./commands/${f}`);
        console.log(`${f} loaded!`);
        bot.commands.set(props.help.name, props);
        props.help.aliases.forEach(alias => {
            bot.aliases.set(alias, props.help.name);
        })
   })
})

//BOTIN ILMOITUKSET YHDISTÄMISEN AIKANA
bot.on("ready", async () => {
    let nimi = botsettings.botin_nimi;
    console.log(`${nimi} on ${bot.guilds.cache.size} servulla onlinessa!`); 
    bot.user.setActivity(`with ${bot.guilds.cache.size} servers!`);  
})

// KOMENTOJEN HANDLAAJA
bot.on("message", async message => {
   
   if(message.channel.type === "dm") return; //ESTÄÄ KOMENTOJEN AJON PRIVATE MESSAGEN KAUTTA
   if(message.author.id === bot.user.id) return; //ESTÄÄ REAGOINNIN TOISEN BOTIN VIESTEIHIN

   //ASETTAA ETULIITTEEN KOMENNOILLE
   let prefix = botsettings.prefix;

   //TAULUKON LUONTI KOMENNOILLE
   if(!message.content.startsWith(prefix)) return; //EI TEE MITÄÄN, JOSSEI VIESTI ALA ETULIITTEELLÄ (ESIM. "!")
   let args = message.content.slice(prefix.length).trim().split(/ +/g); //ETULIITE JA EXTRA VÄLILYÖNNIT (ALUSTA JA LOPUSTA) POISTETAAN, VIESTI JAETAAN TAULUKKOON VÄLILYÖNTIEN PERUSTEELLA
   let cmd = args.shift().toLowerCase(); //TAULUKON 1. ELEMENTTI POISTETAAN JA TALLENNETAAN, JÄLJELLE JÄÄVÄT MUUTTUU AUTOMAATTISESTI PIENIKSI KIRJAIMIKSI 
   let command; 

   //KOMENTOJEN AJO
   if(bot.commands.has(cmd)) {
     command = bot.commands.get(cmd);  
   } else if(bot.aliases.has(cmd)) {
       command = bot.commands.get(bot.aliases.get(cmd));
   }
   try {
       command.run(bot, message, args);
   } catch(e) {
       return;
   }
})

//BOTIN TOKENI HAETAAN
bot.login(botsettings.token); 