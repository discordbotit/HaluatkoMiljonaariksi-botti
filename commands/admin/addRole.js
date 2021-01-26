module.exports.run = async (bot, message, args) => {

    let roleName = 'Haluatko miljonääriksi';

    // Suoritetaan haku, löytyykö roolin nimi jo serveriltä
    let role = message.guild.roles.cache.find(x => x.name === roleName);

    if (!role) {
    // Jos ei löydy, niin luodaan sellainen
        message.guild.roles.create({
            data: {
                name: 'Haluatko miljonääriksi',
                color: 'BLUE',
            },
            reason: '',
        })
            .then(console.log("Haluatko miljonääriksi -rooli lisätiin serverille."))
            .catch(console.error);
    } else {
        return(console.log("Haluatko miljonääriksi rooli löytyy jo serveriltä!"));
    }   
}

// Komento toimii näillä sanoilla   
module.exports.help = {
    name: "add_role",
    aliases: []
}
