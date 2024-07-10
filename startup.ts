import DiscordJS, { GatewayIntentBits, Events } from "discord.js";
import dotenv from "dotenv";
import { SetupFunctions } from "./setup";
import { CommandBridge } from "./interpreters/std_bridge";
import { DatabaseFunctions } from "./utility/database";
import { UtilityFunctions } from "./utility/general";
import { Connection, Pool } from "mysql2";
import { LogLevel, LoggingFunctions } from "./utility/logging";

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

const gamesDBName: string | undefined = process.env.DATABASE;
const connectionMode: string | undefined = process.env.CONNECTIONMODE;
const guildID: string = String(process.env.TESTGUILD);
let gamedb: Connection | Pool | undefined = undefined;
let port: number | undefined = parseInt(String(process.env.PORT?.trim()));
port = isNaN(port) ? undefined : port;
const isPool: boolean =
    connectionMode === undefined || connectionMode.toLowerCase() === "pool";

client.on(Events.ClientReady, () => {
    LoggingFunctions.log(
        "Bot is ready.",
        LogLevel.INFO,
        undefined,
        undefined,
        true
    );

    const guild =
        process.env.MODE === "test"
            ? client.guilds.cache.get(guildID)
            : undefined;

    DatabaseFunctions.createDatabase(
        process.env.HOST,
        process.env.USER,
        process.env.PASSWORD,
        gamesDBName,
        port
    );

    if (isPool) {
        gamedb = DatabaseFunctions.createPool(
            process.env.HOST,
            process.env.USER,
            process.env.PASSWORD,
            gamesDBName,
            port
        );
    }

    SetupFunctions.commandSetup(guild, client);

    LoggingFunctions.log(
        "Bot has completed setup.",
        LogLevel.INFO,
        undefined,
        undefined,
        true
    );
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    if (!isPool || gamedb === undefined) {
        gamedb = DatabaseFunctions.connect(
            process.env.HOST,
            process.env.USER,
            process.env.PASSWORD,
            gamesDBName,
            port
        );
    }

    const id =
        process.env.EXECUTIONMODE?.toLowerCase() === "test"
            ? guildID
            : String(interaction.guild?.id);

    await CommandBridge.reply(interaction, gamedb, id, client).then(() => {
        if (!isPool) {
            DatabaseFunctions.disconnect(gamedb);
        }
    });
});

client.login(process.env.TOKEN);
