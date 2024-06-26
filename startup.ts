import DiscordJS, { GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import { SetupFunctions } from "./setup";
import { CommandBridge } from "./interpreters/std_bridge";
import { DatabaseFunctions } from "./utility/database";
import { UtilityFunctions } from "./utility/general";

dotenv.config();

const client = new DiscordJS.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

UtilityFunctions.errorCheck(
    process.env.TOKEN === undefined,
    "Token must be provided"
);
UtilityFunctions.errorCheck(
    process.env.USER === undefined,
    "Username must be provided"
);
UtilityFunctions.errorCheck(
    process.env.DATABASE === undefined,
    "Database name must be provided"
);

const gamesDBName = process.env.DATABASE;
const dbHost = process.env.HOST === undefined ? "localhost" : process.env.HOST;
const guildID = String(process.env.TESTGUILD);

client.on(Events.ClientReady, () => {
    console.log("Bot is ready.");

    const guild =
        process.env.MODE === "test"
            ? client.guilds.cache.get(guildID)
            : undefined;

    SetupFunctions.commandSetup(guild, client);

    console.log("Bot has completed setup.");
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const gamedb = DatabaseFunctions.connect(
        dbHost,
        process.env.USER,
        process.env.PASSWORD,
        gamesDBName
    );

    let id =
        process.env.MODE === "test" ? guildID : String(interaction.guild?.id);

    await CommandBridge.reply(interaction, gamedb, id, client).then(() => {
        DatabaseFunctions.disconnect(gamedb);
    });
});

client.login(process.env.TOKEN);
