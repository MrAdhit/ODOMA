const Discord = require("discord.js");
const { Rcon } = require("rcon-client");
const log4js = require("log4js");
const logger = log4js.getLogger();
const config = require("./config.json");
const setting = require("./settings.json");
const fs = require("fs/promises");
const lang = require("./lang.json");

const client = new Discord.Client({intents:["GUILDS", "GUILD_MESSAGES"]});
const rcon = Rcon.connect({host: config.minecraft.host, port: config.minecraft.port, password: config.minecraft.password}).catch((res) => {logger.error("Failed to connect to the Minecraft server"); process.exit();});
const prefix = setting.prefix;
logger.level = "debug";

let whitelisted = require("./whitelisted.json");

client.on("ready", async()=> {
    if(setting["enable-status"]){
        client.user.setActivity(setting["status-message"]);
    }

    logger.info(`ODOMA is connected to ${client.user.username}#${client.user.discriminator}`);
});

client.on("messageCreate", async(message)=> {
    if(setting["only-allow-in-channel"]){
        if(message.channelId != setting.channelid) return;
    }
    if(!message.content.includes(prefix)) return;
    const command = message.content.replace(prefix, "").split(" ")[0];
    const args =  message.content.replace(prefix + command + " ", "").split(" ");
    switch(command){
        case "verify":
            if(typeof(whitelisted[message.author.id]) != "undefined") return message.channel.send(lang["iswhitelisted"].replace("{authorusername}", message.author.username).replace("{authordiscriminator}", message.author.discriminator).replace("{whitelistedname}", whitelisted[message.author.id]));
            whitelisted[message.author.id] = args[0];
            logger.info(`${args[0]} is requesting whitelist`);
            (await rcon).send("whitelist add " + args[0]);
            message.channel.send(lang["success-whitelisted"].replace("{authorusername}", message.author.username).replace("{authordiscriminator}", message.author.discriminator).replace("{whitelistedname}", args[0]));
            saveWhitelist();
            break;
        case "unverify":
            if(typeof(whitelisted[message.author.id]) == "undefined") return message.channel.send(lang["isnotwhitelisted"].replace("{authorusername}", message.author.username).replace("{authordiscriminator}", message.author.discriminator));
            message.channel.send(lang["success-unwhitelisted"].replace("{authorusername}", message.author.username).replace("{authordiscriminator}", message.author.discriminator).replace("{whitelistedname}", whitelisted[message.author.id]));
            (await rcon).send("whitelist remove " + whitelisted[message.author.id]);
            delete whitelisted[message.author.id];
            logger.info(`${args[0]} is requesting unwhitelist`);
            saveWhitelist();
            break;
    }
});

function saveWhitelist(){
    fs.writeFile("./whitelisted.json", JSON.stringify(whitelisted, null, 5));
    logger.debug(`Whitelisted file is updated`);
}

client.login(config.token);