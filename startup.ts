import DiscordJS, { GatewayIntentBits, Events } from 'discord.js'
import dotenv from 'dotenv'
import mysql from 'mysql'
import { SetupFunctions } from './setup'
import { CommandInterpreter } from './interpreter'


dotenv.config()

const client = new DiscordJS.Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const gamesDBName = process.env.DATABASE
const guildID = '1032153970254282753'

const gamedb = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: gamesDBName,
    charset : 'utf8mb4'
})

gamedb.connect( (err) => {
    if(err){
        console.log(`Issue Connecting to MYSQL Database. ${err}`)
    }
    return
})

client.on('ready', () => {
    console.log('Bot is ready.')

    gamedb.query(`CREATE DATABASE IF NOT EXISTS ${gamesDBName}`, (err, res) => {
        if(err){
            console.log(err)
        }
    })

    const guild = client.guilds.cache.get(guildID)
    
    SetupFunctions.commandSetup(guild, client);

    console.log('Bot has completed setup.')
})

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()){
        return
    }

    CommandInterpreter.interpret(interaction, gamedb, guildID, client)
})

client.login(process.env.TOKEN)
