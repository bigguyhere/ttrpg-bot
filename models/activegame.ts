import {
    ApplicationCommand,
    ApplicationCommandOptionType,
    ApplicationCommandSubCommand,
    Collection,
    GuildResolvable,
} from "discord.js";
import DiscordJS, { EmbedBuilder } from "discord.js";
import mysql, { RowDataPacket, Connection, Pool } from "mysql2";

export class ActiveGame {
    constructor(
        public serverID: string | null,
        public gameName: string | null,
        public gameType: string | null,
        public DM: string,
        public isActive: boolean = true,
        public defaultRoll: string = "",
        public round: number = 0,
        public turn: number = 0,
        public hideHP: boolean = false,
        public channelID: string | null = null,
        public messageID: string | null = null
    ) {
        this.serverID = serverID;
        this.gameName = gameName;
        this.gameType = gameType;
        this.DM = DM;
        this.isActive = isActive;
        this.defaultRoll = defaultRoll;
        this.round = round;
        this.turn = turn;
        this.hideHP = hideHP;
        this.channelID = channelID;
        this.messageID = messageID;
    }

    public static createTable(db: Connection | Pool) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ActiveGames ( 
            SERV_ID varchar(255) NOT NULL,
            GameName varchar(255) NOT NULL,
            GameType varchar(255),
            DM varchar(255) NOT NULL,
            isActive BOOLEAN,
            DefaultRoll varchar(50),
            Round INT,
            Turn INT,
            HideHP BOOLEAN,
            MessageID varchar(255),
            ChannelID varchar(255),
            PRIMARY KEY (SERV_ID, GameName));`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    private inactivizeGames(db: Connection | Pool): void {
        db.execute(
            `UPDATE ActiveGames SET isActive = 0 WHERE isActive = 1 and SERV_ID = ${this.serverID};`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    addToTable(db: Connection | Pool) {
        //Sets currently active game(s) to inactive
        this.inactivizeGames(db);

        //Inserts new game to the game table, set as the active game
        db.execute(
            `INSERT INTO ActiveGames (SERV_ID, GameName, GameType, DM, isActive, Round, Turn, HideHP, MessageID, ChannelID)
        VALUES (${this.serverID}, "${this.gameName}", "${this.gameType}", ${this.DM}, ${this.isActive}, 
                ${this.round}, ${this.turn}, ${this.hideHP}, ${this.messageID}, ${this.channelID});`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    setDM(db: Connection | Pool) {
        db.execute(
            `UPDATE ActiveGames SET DM = '${this.DM}' 
                    WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    updateInit(
        db: Connection | Pool,
        newChnnlID: string | null,
        newMsgID: string | null,
        newRoll: string,
        newRound: number,
        newTurn: number,
        newHideHP: boolean
    ) {
        this.channelID = newChnnlID;
        this.messageID = newMsgID;
        this.defaultRoll = newRoll;
        db.execute(
            `UPDATE ActiveGames SET MessageID = ${newMsgID},
                                            ChannelID = ${newChnnlID},
                                            DefaultRoll = '${newRoll}',
                                            Round = ${newRound},
                                            Turn = ${newTurn},
                                            HideHP = ${newHideHP}
                    WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    changeGame(db: Connection | Pool) {
        this.inactivizeGames(db);

        db.execute(
            `UPDATE ActiveGames SET isActive = 1 WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    static getCurrentGame(
        db: Connection | Pool,
        dbName: string,
        serverID: string | null,
        gameName: string | null
    ): Promise<ActiveGame | null> {
        return new Promise((resolve) => {
            let queryParam;

            if (gameName == null) {
                queryParam = "isActive = 1";
            } else {
                queryParam = `GameName = '${gameName}'`;
            }

            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${dbName}.ActiveGames WHERE ${queryParam} AND SERV_ID = '${serverID}';`,
                (err, res) => {
                    if (err || res.length != 1) {
                        return resolve(null);
                    }

                    return resolve(
                        new ActiveGame(
                            res[0].SERV_ID,
                            res[0].GameName,
                            res[0].GameType,
                            res[0].DM,
                            res[0].isActive,
                            res[0].DefaultRoll,
                            res[0].Round,
                            res[0].Turn,
                            res[0].HideHP,
                            res[0].ChannelID,
                            res[0].MessageID
                        )
                    );
                }
            );
        });
    }

    static async buildSummaryEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        cmds: Collection<
            string,
            ApplicationCommand<{ guild: GuildResolvable }>
        > | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (cmds == null) {
            return null;
        }
        let embeds: EmbedBuilder[] = [];

        for (let cmd of cmds) {
            const optLen = cmd[1].options.length;
            const numEmbeds =
                optLen > 0 ? Math.ceil(optLen / paginationLimit) : 1;

            for (let i = 0; i < numEmbeds; ++i) {
                let embed = new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(
                        `**${cmd[1].name[0].toUpperCase()}${cmd[1].name.substring(
                            1
                        )} Command Info:**`
                    )
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp();

                let descStr = `${cmd[1].description}\n`;

                const curLimit = paginationLimit * (i + 1);
                const limit = curLimit > optLen ? optLen : curLimit;
                for (let j = paginationLimit * i; j < limit; ++j) {
                    const opt = cmd[1].options[j];
                    descStr += `\n**${opt.type == 1 ? cmd[1].name + "-" : ""}${
                        opt.name
                    } (${ApplicationCommandOptionType[opt.type]})**: ${
                        opt.description
                    }`;
                }

                embed.setDescription(descStr);

                embeds.push(embed);
            }
        }

        return embeds;
    }

    static async buildViewEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        cmd:
            | ApplicationCommand<{ guild: GuildResolvable }>
            | ApplicationCommandSubCommand,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        let embeds: EmbedBuilder[] = [];

        if (cmd.options) {
            const optLen = cmd.options.length;
            const numEmbeds =
                optLen > 0 ? Math.ceil(optLen / paginationLimit) : 1;

            for (let i = 0; i < numEmbeds; ++i) {
                let embed = new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(
                        `**${cmd.name[0].toUpperCase()}${cmd.name.substring(
                            1
                        )} Command Info:**`
                    )
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp();

                let descStr = `${cmd.description}\n`;

                const curLimit = paginationLimit * (i + 1);
                const limit = curLimit > optLen ? optLen : curLimit;
                for (let j = paginationLimit * i; j < limit; ++j) {
                    const opt = cmd.options[j];
                    descStr += `\n**${opt.type == 1 ? cmd.name + "-" : ""}${
                        opt.name
                    } (${ApplicationCommandOptionType[opt.type]})**: ${
                        opt.description
                    }`;
                }

                embed.setDescription(descStr);

                embeds.push(embed);
            }
        } else {
            return null;
        }

        return embeds;
    }
}
