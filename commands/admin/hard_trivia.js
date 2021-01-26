const mongoose = require("mongoose"); // Mongoose moduuli mukaan
const botconfig = require("../../botconfig.json"); // Määritellään botin asetukset JSON-tiedostosta
const fetch = require('node-fetch'); // Node-fetch moduuli mukaan

// Yhdistetään MongoDB:hen
mongoose.connect(botconfig.mongoPass, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const Data = require("../../models/hard_questions.js"); // Viitataan malliin users.js

// Tällä funktiolla encodataan base64 stringit uft8-muotoon 
// Kts. selitys Trivia linkin kohdalta, miksi data haetaan juuri base64-muodossa eikä default
function encodeBase64ToUFT8 (base64string) {
    const buff = Buffer.from(base64string, 'base64');
    const buff_final = buff.toString('utf8');
    return buff_final;
};

// Tällä funktiolla encodataan väärien vastausten taulukot
function arrayEncodeBase64ToUFT8 (base64array) {
    uft8_array = [];
    for (let i = 0; i <= 2; i++) {
        const buff = Buffer.from(base64array[i], 'base64');
        const buff_final = buff.toString('utf8');
        uft8_array.push(buff_final);
    }
    return uft8_array;
};

module.exports.run = async (bot, message, args) => {
    // Toistetaan kysymyksen lisäys 10 kertaa
    for (let i = 1; i <= 10; i++) {
    
    // Pyydetään tietoja Trivia DB:stä
    let response = await fetch(`https://opentdb.com/api.php?amount=1&difficulty=hard&type=multiple&encode=base64`); // HUOM. linkit base64 encodella, koska defaultilla esim. heittomerkit näkyy json-tiedostossa "&quot;", käsittelemällä base64 -> uft8 saadaan kaikki merkit näkymään oikein
    // Muutetaan nämä tiedot json-muotoon
    let data = await response.json();

    // Luodaan uusi dokumentti, jonka schemaan tiedot tulee results-arrayn nollapaikalta, jossa halutut tiedot sijaitsevat
    const newData = new Data({
        category: encodeBase64ToUFT8(data.results[0].category),
        type: encodeBase64ToUFT8(data.results[0].type),
        difficulty: encodeBase64ToUFT8(data.results[0].difficulty),
        question: encodeBase64ToUFT8(data.results[0].question),
        correct_answer: encodeBase64ToUFT8(data.results[0].correct_answer),
        incorrect_answers: arrayEncodeBase64ToUFT8(data.results[0].incorrect_answers),
        })
        newData.save().catch(err => console.log(err)); // Dokumentin tallennus tietokantaan
    };
} 

// Komento toimii näillä sanoilla   
module.exports.help = {
    name: "hard_trivia",
    aliases: []
}
