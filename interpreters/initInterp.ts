import {
    CacheType,
    ChatInputCommandInteraction,
    Client,
    CommandInteractionOptionResolver,
} from "discord.js";
import { Connection } from "mysql2";
import { ActiveGame } from "../models/activegame";
import { Initiative } from "../models/initiative";
import { UtilityFunctions } from "../utility/general";
import { Bridge, Interpreter } from "./abstract_models";

export class InitInterpreter extends Interpreter {
    protected userID: string;
    protected guildID: string;
    constructor(
        gamedb: Connection,
        tableNameBase: string,
        options: Omit<
            CommandInteractionOptionResolver<CacheType>,
            "getMessage" | "getFocused"
        >,
        client: Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>
    ) {
        super(gamedb, tableNameBase, options, client, interaction);
        this.guildID = String(interaction.guild?.id);
        this.userID = interaction.user.id;
    }

    public async begin(activeGame: ActiveGame): Promise<string> {
        let hideHP = this.options.getBoolean("hide-hp");
        hideHP ??= false;

        if (activeGame.messageID != null) {
            return (
                "Cannot start initiative as there is already one in progress." +
                " Please end other initiative before starting a new one."
            );
        }

        let roll = this.options.getString("roll");
        roll ??= "1d20";

        return this.initSetup(activeGame, roll, hideHP, "Initiative");
    }

    public async end(activeGame: ActiveGame): Promise<string> {
        if (activeGame.messageID == null) {
            return "Cannot end initiative as there is none in progress.";
        }

        Initiative.dropTable(this.gamedb, this.tableNameBase);

        if (activeGame.channelID != null && activeGame.messageID != null) {
            let message = await UtilityFunctions.getMessage(
                this.interaction.guild,
                activeGame.channelID,
                activeGame.messageID
            );
            await message?.unpin();

            activeGame.updateInit(this.gamedb, null, null, "1d20", 0, 0, false);

            return (
                `**Initative Summary**\n*Rounds:* ${activeGame.round}\n*Turns:* ${activeGame.turn}` +
                `\n${message?.content == undefined ? "" : message.content}`
            );
        }

        return "Error Finding ChannelID and/or MessageID";
    }

    public async next(activeGame: ActiveGame): Promise<string> {
        if (activeGame.messageID == null) {
            return "Error: No initative in progress.";
        }

        let nextInit = await Initiative.nextTurn(
            this.gamedb,
            this.tableNameBase,
            activeGame
        );

        if (nextInit == undefined) {
            return "Issue proceeding to next turn.";
        }

        if (activeGame.channelID != null) {
            let message = await UtilityFunctions.getMessage(
                this.interaction.guild,
                activeGame.channelID,
                activeGame.messageID
            );
            await message?.edit(
                await Initiative.buildInitMsg(
                    this.gamedb,
                    this.tableNameBase,
                    activeGame
                )
            );
        }

        const displayUser = await this.client.users.fetch(nextInit?.user);

        return (
            `${
                nextInit?.emote == undefined
                    ? ""
                    : UtilityFunctions.getEmoteDisplay(
                          this.client,
                          nextInit.emote
                      )
            }` +
            `${displayUser} (Round ${activeGame.round}, Turn ${activeGame.turn}) **${nextInit?.name}'s** Turn!`
        );
    }

    public async addCharacter(
        activeGame: ActiveGame,
        bridge: Bridge
    ): Promise<string> {
        if (activeGame.messageID == null) {
            return "Cannot add character to initiative as there is none in progress.";
        }

        let chrName = UtilityFunctions.formatString(
            this.options.getString("char-name", true)
        );
        let emote = UtilityFunctions.getEmojiID(
            UtilityFunctions.formatString(this.options.getString("emote"))
        );
        let hp = this.options.getNumber("hp");

        const chr = await bridge.getCharacter(chrName);
        let dmg = 0;
        if (hp == null && chr != null) {
            hp = chr.health;
            dmg = chr.dmgTaken;
        }

        if (emote == null && chr != null) {
            emote = chr.emote;
        }

        let quantity = this.options.getNumber("quantity");

        quantity ??= 1;

        let replyStr = "";

        for (let chrInd = 0; chrInd < quantity; ++chrInd) {
            let name = quantity == 1 ? chrName : `${chrName} ${chrInd + 1}`; //TODO: Figure out a better way to do this
            const query = this.options.getString("query");

            const result = UtilityFunctions.parseRoll(
                query == null ? activeGame.defaultRoll : query
            );

            if (result == undefined) {
                return "Error parsing roll.";
            }

            if (
                !(await new Initiative(
                    name,
                    result[1],
                    emote,
                    this.userID,
                    false,
                    hp,
                    dmg
                ).addToTable(this.gamedb, this.tableNameBase))
            ) {
                return "Error: Character is already in initiative.";
            }

            replyStr += `Character **\"${name}\"** added to initiative: ${result[0]} = __*${result[1]}*__\n`;
        }

        if (activeGame.channelID != null) {
            let message = await UtilityFunctions.getMessage(
                this.interaction.guild,
                activeGame.channelID,
                activeGame.messageID
            );
            await message?.edit(
                await Initiative.buildInitMsg(
                    this.gamedb,
                    this.tableNameBase,
                    activeGame
                )
            );
        }

        return replyStr;
        //return 'Issue adding character(s) to initiative.'
    }

    public async removeCharacter(activeGame: ActiveGame) {
        if (activeGame.messageID == null) {
            return "Cannot remove character from initiative as there is none in progress.";
        }

        const chrName = UtilityFunctions.formatString(
            this.options.getString("char-name", true)
        );

        const init = new Initiative(chrName);

        init.removeFromTable(this.gamedb, this.tableNameBase);

        if (activeGame.channelID != null) {
            let message = await UtilityFunctions.getMessage(
                this.interaction.guild,
                activeGame.channelID,
                activeGame.messageID
            );
            await message?.edit(
                await Initiative.buildInitMsg(
                    this.gamedb,
                    this.tableNameBase,
                    activeGame
                )
            );

            return `**\"${chrName}\"** successfully removed from initiative.`;
        }

        return "Issue removing character from initiative.";
    }

    public async setActiveChar(activeGame: ActiveGame) {
        if (activeGame.turn == 0) {
            return "Cannot change initiative when initiative hasn't started.";
        }

        if (activeGame.messageID == null) {
            return "Cannot remove character from initiative as there is none in progress.";
        }

        const chrName = UtilityFunctions.formatString(
            this.options.getString("char-name", true)
        );

        //Needed to assert character is in initiative already
        const initChr = await Initiative.getInitChr(
            this.gamedb,
            this.tableNameBase,
            chrName
        );

        if (initChr == null) {
            return "Issue finding initiative character.";
        }

        if (
            !(await initChr.changeInit(
                this.gamedb,
                this.tableNameBase,
                activeGame
            ))
        ) {
            return "Error: Initiative hasn't started yet";
        }

        if (activeGame.channelID != null) {
            let message = await UtilityFunctions.getMessage(
                this.interaction.guild,
                activeGame.channelID,
                activeGame.messageID
            );
            await message?.edit(
                await Initiative.buildInitMsg(
                    this.gamedb,
                    this.tableNameBase,
                    activeGame
                )
            );

            return `**\"${chrName}\"** successfully set to active in initiative.`;
        }

        return "Issue changing character from initiative.";
    }

    public async changeHP(activeGame: ActiveGame, bridge: Bridge) {
        const chrName = UtilityFunctions.formatString(
            this.options.getString("char-name", true)
        );
        const value = this.options.getNumber("value", true) * -1;
        let initOnly = this.options.getBoolean("init-only");

        initOnly ??= false;

        const chr = await bridge.getCharacter(chrName);
        let replyStr = "";
        const isChrFindable = !initOnly && chr != null && chr != undefined;

        if (isChrFindable) {
            if (
                !(await chr.updateStat(
                    this.gamedb,
                    this.tableNameBase,
                    "DmgTaken",
                    String(value),
                    true
                ))
            ) {
                return "Error: Cannot increment a non-number.";
            }
            replyStr += "Character ";
        }

        if (activeGame.messageID == null) {
            return `${replyStr}for **\"${chrName}\"** updated.`;
        }

        const initChr = await Initiative.getInitChr(
            this.gamedb,
            this.tableNameBase,
            chrName
        );

        if (initChr != null && initChr.HP != null) {
            if (activeGame == null) {
                return "Issue retrieving active game.";
            }

            initChr.updateDMG(this.gamedb, this.tableNameBase, value);
            replyStr += isChrFindable ? "& " : "";
            replyStr += "Initiative ";

            if (activeGame.channelID != null && activeGame.messageID != null) {
                let message = await UtilityFunctions.getMessage(
                    this.interaction.guild,
                    activeGame.channelID,
                    activeGame.messageID
                );
                await message?.edit(
                    await Initiative.buildInitMsg(
                        this.gamedb,
                        this.tableNameBase,
                        activeGame
                    )
                );
            }
        }

        return replyStr === ""
            ? "Error: Character & Initiative not found"
            : `${replyStr}for **\"${chrName}\"** updated.`;
    }

    protected async initSetup(
        activeGame: ActiveGame,
        roll: string,
        hideHP: boolean,
        message: string
    ) {
        Initiative.createTable(this.gamedb, this.tableNameBase);

        const msg = await this.interaction.channel?.send(
            await Initiative.buildInitMsg(
                this.gamedb,
                this.tableNameBase,
                activeGame
            )
        );

        await msg?.pin();

        if (msg == undefined) {
            return "Error sending initiative message.";
        }

        activeGame.updateInit(
            this.gamedb,
            msg.channel.id,
            msg.id,
            roll,
            0,
            0,
            hideHP
        );

        return `**${message} Begins !**`;
    }
}
