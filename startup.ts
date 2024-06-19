import DiscordJS, { GatewayIntentBits, Events } from 'discord.js'
import dotenv from 'dotenv'
import { SetupFunctions } from './setup'
import { CommandBridge } from './interpreters/std_bridge'
import { DatabaseFunctions } from './utility/database'
import { UtilityFunctions } from './utility/general'


dotenv.config()

const client = new DiscordJS.Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
})

const gamesDBName = process.env.DATABASE;
const guildID = String(process.env.TESTGUILD);

client.on(Events.ClientReady, () => {
    console.log('Bot is ready.');

    //console.log(UtilityFunctions.infixToPostfix('   20d20t10  + 20d20b3-1d20e8 / 2  - 1 d200 * (d20adv    + 1d8dis  + 22)'));
    //console.log(UtilityFunctions.parseRoll('   20d20t10  + 20d20b3-1d20e8 / 2  - 1 d200 * (d20adv    + 1d8dis  + 22)'));
    const guild = process.env.MODE === 'test' ? client.guilds.cache.get(guildID) : undefined;
    
    SetupFunctions.commandSetup(guild, client);

    console.log('Bot has completed setup.');
})

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()){
        return
    }

    const gamedb = DatabaseFunctions.connect(process.env.HOST, process.env.USER, process.env.PASSWORD, gamesDBName);

    let id = process.env.MODE === 'test' ? guildID : String(interaction.guild?.id); 
    
    await CommandBridge.reply(interaction, gamedb, id, client).then(() => {
        DatabaseFunctions.disconnect(gamedb)
    });
})

client.login(process.env.TOKEN)