module.exports.run = async (bot, message, args) => {


    let roleName = 'Haluatko miljonääriksi';
    let role = message.guild.roles.cache.find(x => x.name === roleName);
    if (!role) {
    // Create a new role with data and a reason
        message.guild.roles.create({
            data: {
            name: 'Haluatko miljonääriksi',
            color: 'BLUE',
            },
            reason: '',
        })
            .then(console.log("Lisättiin Haluatko miljonääriksi rooli serverille!"))
            .catch(console.error);
    } else {
        return(console.log("Haluatko miljonääriksi rooli löytyy jo serveriltä!"));
    }  
    
}


//komento toimii näillä sanoilla   
module.exports.help = {
    name: "add_role",
    aliases: []
}
