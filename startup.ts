import DiscordJS, { GatewayIntentBits, Events } from 'discord.js'
import dotenv from 'dotenv'
import { SetupFunctions } from './setup/setup'
import { CommandBridge } from './interpreters/std_bridge'
import { DatabaseFunctions } from './utility/database'


dotenv.config()

const client = new DiscordJS.Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
})

const gamesDBName = process.env.DATABASE
const guildID = String(process.env.TESTGUILD)

client.on(Events.ClientReady, () => {
    console.log('Bot is ready.')

    const guild = client.guilds.cache.get(guildID)
    
    SetupFunctions.commandSetup(guild, client);

    console.log('Bot has completed setup.')
})

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()){
        return
    }

    const gamedb = DatabaseFunctions.connect(process.env.HOST, process.env.USER, process.env.PASSWORD, gamesDBName)

    await CommandBridge.reply(interaction, gamedb, guildID, client).then(() => {
        DatabaseFunctions.disconnect(gamedb)
    })
})

client.login(process.env.TOKEN)