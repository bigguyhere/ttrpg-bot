import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import mysql, {
    Connection,
    Pool,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2";
import { ActiveGame } from "../../../models/activegame";
import { IDRSkillObj } from "./dr_objectDefs";
import {
    LogLevel,
    LoggingFunctions,
    SeverityLevel,
} from "../../../utility/logging";

export class DRSkill {
    public id: number;
    public prereqs: string;
    public Type: string;
    constructor(
        public name: string,
        prereqs: string | null = null,
        public desc: string = "",
        public spCost: number = -1,
        Type: string | null = null
    ) {
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.spCost = spCost;
        this.Type = Type == null ? "Private" : Type;
        this.prereqs = prereqs == null ? "None" : prereqs;
    }

    static createTables(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_Skills ( 
            SKL_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Prereqs varchar(255),
            Description varchar(2000),
            SPCost SMALLINT,
            Type varchar(3) NOT NULL,
            PRIMARY KEY (SKL_ID));`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_Skills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );

        DRChrSkills.createTables(db, tableBaseName);
    }

    static getSkill(
        db: Connection | Pool,
        tableBaseName: string,
        skill_name: string
    ): Promise<DRSkill | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Skills WHERE Name = "${skill_name}";`,
                (err, res) => {
                    if (err || res.length != 1) {
                        LoggingFunctions.log(
                            `Unable to get DR skills \"${skill_name}\" from \"${tableBaseName}_Skills\"\n${
                                res.length === 1
                                    ? err?.stack
                                    : `Multiple values (${res.length}) returned.`
                            }`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    let retSkill = new DRSkill(
                        res[0].Name,
                        res[0].Prereqs,
                        res[0].Description,
                        res[0].SPCost,
                        res[0].Type
                    );
                    retSkill.id = res[0].SKL_ID;

                    return resolve(retSkill);
                }
            );
        });
    }

    static getAllSkills(
        db: Connection | Pool,
        tableBaseName: string,
        startIndex: number | null = null,
        endIndex: number | null = null
    ): Promise<Array<DRSkill> | null> {
        return new Promise((resolve) => {
            let queryStr = `SELECT * FROM ${tableBaseName}_Skills ORDER BY Name`;
            if (startIndex != null) {
                queryStr += `LIMIT ${startIndex}`;
            }
            if (endIndex != null) {
                queryStr += `, ${endIndex}`;
            }
            queryStr += ";";

            db.execute<IDRSkillObj[]>(queryStr, (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to get all DR skills from \"${tableBaseName}_Skills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    return resolve(null);
                }

                let retArr = new Array<DRSkill>();

                res.forEach((skill) => {
                    let retSkill = new DRSkill(
                        skill.Name,
                        skill.Prereqs,
                        skill.Description,
                        skill.SPCost,
                        skill.Type
                    );
                    retSkill.id = skill.SKL_ID;

                    retArr.push(retSkill);
                });

                return resolve(retArr);
            });
        });
    }

    isViewable(
        db: Connection | Pool,
        tableBaseName: string,
        owner: string
    ): Promise<boolean | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT DISTINCT Skills.SKL_ID FROM ${tableBaseName}_Skills as Skills 
                        JOIN ${tableBaseName}_ChrSkills as ChrSkills
                        JOIN ${tableBaseName}_Characters as Characters 
                                            WHERE 
                                            Characters.Owner = '${owner}'
                                            AND Characters.CHR_ID = ChrSkills.CHR_ID
                                            AND ChrSkills.SKL_ID = Skills.SKL_ID
                                            AND Skills.Type != 'PUB'
                                            ORDER BY Skills.SKL_ID;`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to check if skills are viewable for character \"${owner}\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    for (const r of res) {
                        if (r.SKL_ID === this.id) {
                            return resolve(true);
                        }
                    }

                    return resolve(false);
                }
            );
        });
    }

    async buildViewEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        client: Client<boolean>,
        activeGame: ActiveGame
    ): Promise<EmbedBuilder> {
        return new EmbedBuilder()
            .setColor(0x7852a9)
            .setTitle(`**${this.name} (ID: ${this.id}) Summary**`)
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(
                `**DM:** ${await client.users.fetch(activeGame.DM)}\n
                        **Prerequisites:** ${this.prereqs}\n
                        **SP Cost:** ${this.spCost}\n
                        **Description:** ${this.desc}`
            )
            .setThumbnail(String(guild?.iconURL()))
            .setTimestamp();
    }

    static async buildSummaryEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        client: Client<boolean>,
        activeGame: ActiveGame,
        skills: Array<DRSkill> | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (skills == null) {
            return null;
        }
        let embeds: EmbedBuilder[] = [];

        const numEmbeds =
            skills.length > 0 ? Math.ceil(skills.length / paginationLimit) : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(`**${activeGame.gameName} Public Skill Summary**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );

            let descStr = `**DM:** ${await client.users.fetch(
                activeGame.DM
            )}\n*Type |* ***(Cost) Name:*** *Prereqs*\n`;

            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > skills.length ? skills.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                descStr += `\n${skills[j].Type} | **(${skills[j].spCost}) - ${skills[j].name}:** ${skills[j].prereqs}`;
            }

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }

    static async buildDynamicViewEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        client: Client<boolean>,
        activeGame: ActiveGame,
        skills: Array<DRSkill> | null
    ): Promise<EmbedBuilder[] | null> {
        if (skills == null) {
            return null;
        }

        let embeds: EmbedBuilder[] = [];

        for (let i = 0; i < skills.length; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(
                        `**${skills[i].name} (ID: ${skills[i].id}) Summary**`
                    )
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setDescription(
                        `**DM:** ${await client.users.fetch(activeGame.DM)}\n
                            **Prerequisites:** ${skills[i].prereqs}\n
                            **SP Cost:** ${skills[i].spCost}\n
                            **Description:** ${skills[i].desc}`
                    )
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );
        }

        return embeds;
    }

    addToTable(db: Connection | Pool, tableBaseName: string) {
        db.execute<ResultSetHeader>(
            `INSERT INTO ${tableBaseName}_Skills (Name, Prereqs, Description, SPCost, Type)
        VALUES ("${this.name}", "${this.prereqs}", "${this.desc}", "${this.spCost}", "${this.Type}");`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to add skill \"${this.name}\" to \"${tableBaseName}_Skills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }

                this.id = res.insertId;
            }
        );
    }

    removeFromTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DELETE FROM ${tableBaseName}_Skills WHERE Name = '${this.name}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete skill \"${this.name}\" from \"${tableBaseName}_Skills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }
}

export class DRChrSkills {
    constructor(public chrId: number, public sklId: number) {
        this.chrId = chrId;
        this.sklId = sklId;
    }

    static createTables(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_ChrSkills (
            CHR_ID INT NOT NULL,
            SKL_ID INT NOT NULL,
            FOREIGN KEY (CHR_ID) REFERENCES ${tableBaseName}_Characters(CHR_ID) ON DELETE CASCADE,
            FOREIGN KEY (SKL_ID) REFERENCES ${tableBaseName}_Skills(SKL_ID) ON DELETE CASCADE);`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_ChrSkills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }

    addToTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `INSERT INTO ${tableBaseName}_ChrSkills (CHR_ID, SKL_ID)
        VALUES ("${this.chrId}", "${this.sklId}");`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to add skill (${this.sklId}) for \"${this.chrId}\" to \"${tableBaseName}_ChrSkills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }

    removeFromTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DELETE FROM ${tableBaseName}_ChrSkills WHERE CHR_ID = '${this.chrId}' AND SKL_ID = '${this.sklId}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete skill (${this.sklId}) for \"${this.chrId}\" to \"${tableBaseName}_ChrSkills\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    //TODO: See if you can make a SQL query in future that can delete if exists and add if doesn't
    ifExists(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<boolean | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_ChrSkills WHERE CHR_ID = '${this.chrId}' AND SKL_ID = '${this.sklId}';`,
                (err, res) => {
                    if (err || res.length > 1) {
                        LoggingFunctions.log(
                            `Unable to check if character \"${
                                this.chrId
                            }\" has skills \"${this.sklId}\"\n${
                                res.length === 1
                                    ? err?.stack
                                    : `Multiple values (${res.length}) returned.`
                            }`,
                            LogLevel.ERROR,
                            SeverityLevel.MEDIUM
                        );
                        return resolve(null);
                    }

                    return resolve(res.length == 1);
                }
            );
        });
    }
}
