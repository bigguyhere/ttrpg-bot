import mysql, {
    Connection,
    Pool,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2";
import { IArbitraryStat, ICharacterObj, IItemObj } from "./objectDefs";
import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import { Inventory } from "./inventory";
import { ActiveGame } from "./activegame";
import { UtilityFunctions } from "../utility/general";
import { LogLevel, LoggingFunctions, SeverityLevel } from "../utility/logging";

export class Character {
    public static defaultEmbedColor = 0x7852a9;

    public id: number;
    public prounouns: string;
    public health: number;
    constructor(
        public name: string,
        public emote: string | null = null,
        prounouns: string | null = null,
        public owner: string = "",
        health: number | null = 0,
        public dmgTaken: number = 0,
        public status: string | null = null,
        public otherStats: Array<[string, string]> = []
    ) {
        this.id = -1;
        this.name = name;
        this.emote = emote;
        this.owner = owner;
        this.dmgTaken = dmgTaken;
        this.status = status;
        this.otherStats = otherStats;

        if (prounouns === null) {
            this.prounouns = "they/them";
        } else {
            this.prounouns = prounouns;
        }

        if (health === null) {
            this.health = 0;
        } else {
            this.health = health;
        }
    }

    static createTable(
        db: Connection | Pool,
        tableBaseName: string,
        additionalStats: string[]
    ) {
        let queryStr = `CREATE TABLE IF NOT EXISTS ${tableBaseName}_Characters ( 
            CHR_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL UNIQUE,
            Emote varchar(255),
            Pronouns varchar(255) NOT NULL,
            Owner varchar(255),
            Health SMALLINT,
            DmgTaken SMALLINT,
            Status varchar(255),\n`;

        for (let stat of additionalStats) {
            queryStr += `\t${stat},\n`;
        }

        queryStr += "PRIMARY KEY (CHR_ID));";

        db.execute(queryStr, (err, res) => {
            if (err) {
                LoggingFunctions.log(
                    `Unable to create table \"${tableBaseName}_Characters\"\n${err.stack}`,
                    LogLevel.ERROR,
                    SeverityLevel.HIGH
                );
                throw err;
            }
        });
    }

    addToTable(
        db: Connection | Pool,
        tableBaseName: string,
        addQuery?: string,
        addValue?: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            let queryStr = `INSERT INTO ${tableBaseName}_Characters (Name, Emote, Pronouns, Owner, Health, DmgTaken, Status${
                addQuery === undefined ? "" : `, ${addQuery}`
            })`;
            let valuesStr = `VALUES ("${this.name}", "${this.emote}", "${
                this.prounouns
            }", "${this.owner}", ${this.health}, ${this.dmgTaken}, 
                            "${this.status}"${
                addValue === undefined ? "" : `, ${addValue}`
            })`;

            db.execute<ResultSetHeader>(
                `${queryStr}\n${valuesStr}`,
                (err, res) => {
                    if (err) {
                        if (err.errno == 1062) {
                            // Duplicate Character
                            LoggingFunctions.log(
                                `Unable to add character \"${this.name}\" to \"${tableBaseName}_Characters\" (Character has already been added)\n${err.stack}`,
                                LogLevel.WARNING,
                                SeverityLevel.LOW
                            );
                            return resolve(false);
                        }
                        LoggingFunctions.log(
                            `Unable to add character \"${this.name}\" to \"${tableBaseName}_Characters\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        throw err;
                    }

                    this.id = res.insertId;

                    return resolve(true);
                }
            );
        });
    }

    private incrementStat(
        db: Connection | Pool,
        tableBaseName: string,
        statName: string,
        statValue: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const value = parseInt(statValue.replace(/,/g, ""));

            if (isNaN(value)) {
                LoggingFunctions.log(
                    `Stat value for \"${statName}\" and character \"${this.name}\" was unable to be numerically parsed"`,
                    LogLevel.WARNING,
                    SeverityLevel.MEDIUM
                );
                return resolve(false);
            }

            db.execute(
                `UPDATE ${tableBaseName}_Characters SET ${statName} = ${statName}+${value} WHERE Name = '${this.name}';`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to increment stat \"${statName}\" for character \"${this.name}\" from \"${tableBaseName}_Characters\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(false);
                    }
                    return resolve(true);
                }
            );
        });
    }

    updateStat(
        db: Connection | Pool,
        tableBaseName: string,
        statName: string,
        statValue: string,
        increment: boolean = false
    ): Promise<boolean> {
        return new Promise((resolve) => {
            if (statName.toUpperCase() === "NAME") {
                return resolve(false);
            }
            if (increment) {
                return resolve(
                    this.incrementStat(db, tableBaseName, statName, statValue)
                );
            }

            db.execute(
                `UPDATE ${tableBaseName}_Characters SET ${statName} = '${statValue}' WHERE Name = '${this.name}';`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to update stat \"${statName}\" for character \"${this.name}\" from \"${tableBaseName}_Characters\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(false);
                    }
                    return resolve(true);
                }
            );
        });
    }

    removeFromTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DELETE FROM ${tableBaseName}_Characters WHERE Name='${this.name}'`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete character \"${this.name}\" from \"${tableBaseName}_Characters\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    static getCharacter(
        db: Connection | Pool,
        tableBaseName: string,
        char_name: string | number
    ): Promise<Character | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`,
                (err, res) => {
                    if (err || res.length != 1) {
                        LoggingFunctions.log(
                            `Unable to get character \"${char_name}\" from \"${tableBaseName}_Characters\"\n${
                                res.length === 1
                                    ? err?.stack
                                    : `Multiple values (${res.length}) returned.`
                            }`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    db.execute<IArbitraryStat[]>(
                        `SHOW COLUMNS FROM ${tableBaseName}_Characters;`,
                        (errr, ress) => {
                            if (errr) {
                                LoggingFunctions.log(
                                    `Unable to get arbitrary stats for character \"${char_name}\" from \"${tableBaseName}_Characters\"\n${errr}`,
                                    LogLevel.WARNING,
                                    SeverityLevel.MEDIUM
                                );
                                return resolve(null);
                            }

                            let stats = new Array<[string, string]>();
                            let baseStats = [
                                "CHR_ID",
                                "Name",
                                "Emote",
                                "Pronouns",
                                "Owner",
                                "Health",
                                "DmgTaken",
                                "Status",
                            ];

                            ress.forEach((stat) => {
                                if (!baseStats.includes(stat.Field)) {
                                    stats.push([
                                        stat.Field,
                                        String(eval(`res[0].${stat.Field}`)),
                                    ]);
                                }
                            });

                            let retChr = new Character(
                                res[0].Name,
                                res[0].Emote,
                                res[0].Pronouns,
                                res[0].Owner,
                                res[0].Health,
                                res[0].DmgTaken,
                                res[0].Status,
                                stats
                            );
                            retChr.id = res[0].CHR_ID;

                            return resolve(retChr);
                        }
                    );
                }
            );
        });
    }

    static getAllCharacters(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<Array<Character> | null> {
        return new Promise((resolve) => {
            db.execute<ICharacterObj[]>(
                `SELECT * FROM ${tableBaseName}_Characters ORDER BY Name;`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to get all characters from \"${tableBaseName}_Characters\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(null);
                    }

                    let retArr = new Array<Character>();

                    res.forEach((char) => {
                        let retChr = new Character(
                            char.Name,
                            char.Emote,
                            char.Pronouns,
                            char.Owner,
                            char.Health,
                            char.DmgTaken,
                            char.Status,
                            []
                        );
                        retChr.id = char.CHR_ID;

                        retArr.push(retChr);
                    });

                    return resolve(retArr);
                }
            );
        });
    }

    getAllChrItems(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<Array<Inventory> | null> {
        return new Promise((resolve) => {
            db.execute<IItemObj[]>(
                `SELECT * FROM ${tableBaseName}_Inventories as Inventories WHERE Inventories.CHR_ID = ${this.id};`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to get all character items from \"${tableBaseName}_Inventories\" for character \"${this.name}\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(null);
                    }

                    let retArr = new Array<Inventory>();

                    res.forEach((item) => {
                        let retItem = new Inventory(
                            item.CHR_ID,
                            item.ItemName,
                            item.Quantity,
                            item.Description,
                            item.Weight
                        );

                        retArr.push(retItem);
                    });

                    return resolve(retArr);
                }
            );
        });
    }

    async buildViewEmbed(
        user: DiscordJS.User,
        client: Client<boolean>
    ): Promise<EmbedBuilder> {
        let thumbnail = client.emojis.resolve(String(this.emote))?.url;
        const owner = await client.users.fetch(this.owner);
        let color = owner.hexAccentColor as
            | DiscordJS.ColorResolvable
            | undefined;

        if (thumbnail == undefined) {
            thumbnail = String(owner?.displayAvatarURL());
        }

        if (color == undefined) {
            color = Character.defaultEmbedColor;
        }

        let embedBuilder = new EmbedBuilder()
            .setColor(color)
            .setTitle(`**${this.name}**`)
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(`${this.prounouns}`)
            .setThumbnail(thumbnail)
            .addFields(
                { name: "**Owner:**", value: String(owner) },
                { name: "\u200B", value: "\u200B" },
                {
                    name: "**Health**",
                    value: String(this.getCurrentHealth()),
                    inline: true,
                },
                { name: "**Status**", value: String(this.status), inline: true }
            )
            .setTimestamp();

        this.otherStats.forEach((stat) => {
            embedBuilder.addFields({
                name: stat[0],
                value: stat[1],
                inline: true,
            });
        });

        return embedBuilder;
    }

    static async buildSummaryEmbed(
        client: DiscordJS.Client,
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        activeGame: ActiveGame,
        chars: Array<Character> | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (chars == null) {
            return null;
        }
        let embeds: EmbedBuilder[] = [];

        const numEmbeds =
            chars.length > 0 ? Math.ceil(chars.length / paginationLimit) : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(Character.defaultEmbedColor)
                    .setTitle(`**${activeGame.gameName} Summary**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );

            let descStr = `**DM:** ${await client.users.fetch(
                activeGame.DM
            )}\n`;

            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > chars.length ? chars.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                let emoteStr = UtilityFunctions.getEmoteDisplay(
                    client,
                    chars[j].emote
                );
                descStr += `\n${await client.users.fetch(chars[j].owner)}: ${
                    chars[j].name
                } ${emoteStr}`;
            }

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }

    async buildInventoryEmbed(
        user: DiscordJS.User,
        client: Client<boolean>,
        items: Array<Inventory> | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (items == null) {
            return null;
        }
        let embeds: EmbedBuilder[] = [];
        let weights: number[] = [];

        let thumbnail = client.emojis.resolve(String(this.emote))?.url;
        const owner = await client.users.fetch(this.owner, {
            force: true,
        });
        let color = owner.hexAccentColor as
            | DiscordJS.ColorResolvable
            | undefined;

        if (thumbnail == undefined) {
            thumbnail = String(owner?.displayAvatarURL());
        }

        if (color == undefined) {
            color = Character.defaultEmbedColor;
        }

        let totalWeight = 0;

        items.forEach((item) => {
            let itemWeight =
                item.weight == null ? 0 : item.quantity * item.weight;
            weights.push(itemWeight);
            totalWeight += itemWeight;
        });

        const numEmbeds =
            items.length > 0 ? Math.ceil(items.length / paginationLimit) : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`**${this.name}'s Inventory**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(thumbnail)
                    .setTimestamp()
            );

            let descStr = `**Item Name:** Amnt *(Weight)*\n`;

            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > items.length ? items.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                descStr += `\n**${items[j].itemName}:** x${items[j].quantity} ${
                    weights[j] == 0 ? "" : `*(${weights[j]})*`
                }`;
            }

            if (totalWeight != 0) {
                descStr += `\n\n**Total Weight:** ${totalWeight}`;
            }

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }

    getCurrentHealth(): number {
        return this.health - this.dmgTaken;
    }

    getPronoun(pronounNum: number): string {
        return this.prounouns.split("/")[pronounNum];
    }
}
