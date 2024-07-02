import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import mysql, {
    Connection,
    Pool,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2";
import { ActiveGame } from "../../../models/activegame";
import { IDRTruthBulletObj } from "./dr_objectDefs";
import {
    LogLevel,
    LoggingFunctions,
    SeverityLevel,
} from "../../../utility/logging";

export class DRTruthBullet {
    public id: number;
    public trial: number;
    constructor(
        public name: string,
        trial: number | null = null,
        public desc: string = "",
        public isUsed: boolean = false
    ) {
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.isUsed = isUsed;

        if (trial == null) {
            this.trial = -1;
        } else {
            this.trial = trial;
        }
    }

    static createTables(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_TruthBullets ( 
            TB_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Description varchar(1000),
            Trial INT,
            isUsed BOOLEAN,
            PRIMARY KEY (TB_ID));`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_TruthBullets\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );

        DRChrTBs.createTables(db, tableBaseName);
    }

    static getTB(
        db: Connection | Pool,
        tableBaseName: string,
        tb_name: string,
        trial: number | null
    ): Promise<DRTruthBullet | null> {
        return new Promise((resolve) => {
            let trialStr = "";
            if (trial != null) {
                trialStr = `AND Trial = "${trial}"`;
            }

            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_TruthBullets WHERE Name = "${tb_name}" ${trialStr};`,
                (err, res) => {
                    if (err || res.length == 0) {
                        LoggingFunctions.log(
                            `Unable to get DR truth bullet \"${tb_name}\" from \"${tableBaseName}_TruthBullets\"\n${
                                res.length === 1
                                    ? err?.stack
                                    : `Multiple values (${res.length}) returned.`
                            }`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    let retTB = new DRTruthBullet(
                        res[0].Name,
                        res[0].Trial,
                        res[0].Description,
                        res[0].isUsed
                    );
                    retTB.id = res[0].TB_ID;

                    return resolve(retTB);
                }
            );
        });
    }

    static getAllTBs(
        db: Connection | Pool,
        tableBaseName: string,
        trial: number | null
    ): Promise<Array<DRTruthBullet> | null> {
        return new Promise((resolve) => {
            let trialStr = "";
            if (trial != null) {
                trialStr = `WHERE Trial = "${trial}"`;
            }

            db.execute<IDRTruthBulletObj[]>(
                `SELECT * FROM ${tableBaseName}_TruthBullets ${trialStr};`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to get all DR truth bullets from \"${tableBaseName}_TruthBullets\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(null);
                    }

                    let retArr = new Array<DRTruthBullet>();

                    res.forEach((tb) => {
                        let retTB = new DRTruthBullet(
                            tb.Name,
                            tb.Trial,
                            tb.Description,
                            tb.isUsed
                        );
                        retTB.id = tb.TB_ID;

                        retArr.push(retTB);
                    });

                    return resolve(retArr);
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
                        **Trial:** ${this.trial == -1 ? "?" : this.trial}\n
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
        tbs: Array<DRTruthBullet> | null,
        paginationLimit: number = 10
    ): Promise<EmbedBuilder[] | null> {
        if (tbs == null) {
            return null;
        }

        let isDM = user.id === activeGame.DM;

        let embeds: EmbedBuilder[] = [];

        const numEmbeds =
            tbs.length > 0 ? Math.ceil(tbs.length / paginationLimit) : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(
                        `**${activeGame.gameName} Truth Bullet Summary ${
                            isDM ? "(DM View)" : "(Used View)"
                        }**`
                    )
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );

            let descStr = `**DM:** ${await client.users.fetch(
                activeGame.DM
            )}\n\n**Truth Bullets:**\n`;
            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > tbs.length ? tbs.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                descStr += `**Trial ${
                    tbs[j].trial == -1 ? "?" : tbs[j].trial
                }:** *${tbs[j].name} (Used: ${
                    tbs[j].isUsed ? "Yes" : "No"
                })* \n`;
            }
            descStr += `\n\n**Total Truth Bullets:** ${tbs.length}`;

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }

    static async buildDynamicViewEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        client: Client<boolean>,
        activeGame: ActiveGame,
        tbs: Array<DRTruthBullet> | null
    ): Promise<EmbedBuilder[] | null> {
        if (tbs == null) {
            return null;
        }

        let embeds: EmbedBuilder[] = [];

        for (let i = 0; i < tbs.length; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(0x7852a9)
                    .setTitle(`**${tbs[i].name} (ID: ${tbs[i].id}) Summary**`)
                    .setAuthor({
                        name: `${user.username}`,
                        iconURL: String(user.displayAvatarURL()),
                    })
                    .setDescription(
                        `**DM:** ${await client.users.fetch(activeGame.DM)}\n
                            **Trial:** ${
                                tbs[i].trial == -1 ? "?" : tbs[i].trial
                            }\n
                            **Description:** ${tbs[i].desc}\n\n
                            **Total Truth Bullets:** ${tbs.length}`
                    )
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );
        }

        return embeds;
    }

    isViewable(db: Connection | Pool, tableBaseName: string, owner: string) {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT DISTINCT TruthBullets.TB_ID FROM ${tableBaseName}_TruthBullets as TruthBullets
                        JOIN ${tableBaseName}_ChrTBs as ChrTBs
                        JOIN ${tableBaseName}_Characters as Characters 
                                            WHERE 
                                            Characters.Owner = '${owner}'
                                            AND Characters.CHR_ID = ChrTBs.CHR_ID
                                            AND ChrTBs.TB_ID = TruthBullets.TB_ID
                                            ORDER BY TruthBullets.TB_ID;`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to check if truth bullets are viewable for character \"${owner}\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    for (const r of res) {
                        if (r.TB_ID === this.id) {
                            return resolve(true);
                        }
                    }

                    return resolve(false);
                }
            );
        });
    }

    addToTable(db: Connection | Pool, tableBaseName: string) {
        db.execute<ResultSetHeader>(
            `INSERT INTO ${tableBaseName}_TruthBullets (Name, Description, Trial, isUsed)
        VALUES ("${this.name}", "${this.desc}", "${this.trial}", ${this.isUsed});`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to add truth bullet \"${this.name}\" to \"${tableBaseName}_TruthBullets\"\n${err.stack}`,
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
        let trialStr = "";
        if (this.trial != null) {
            trialStr = `AND Trial = "${this.trial}"`;
        }

        db.execute(
            `DELETE FROM ${tableBaseName}_TruthBullets WHERE Name = '${this.name}' ${trialStr};`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete truth bullet \"${this.name}\" from \"${tableBaseName}_TruthBullets\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    useTB(
        db: Connection | Pool,
        tableBaseName: string,
        value: boolean | null = null
    ) {
        let trialStr = this.trial == null ? "" : `AND Trial = ${this.trial}`;
        let valueStr = value == null ? "NOT isUsed" : String(value);

        db.execute(
            `UPDATE ${tableBaseName}_TruthBullets SET isUsed = ${valueStr} WHERE Name = "${this.name}" ${trialStr};`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to use truth bullet \"${this.name}\" from \"${tableBaseName}_TruthBullets\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.MEDIUM
                    );
                    throw err;
                }
            }
        );
    }
}

export class DRChrTBs {
    constructor(public chrId: number, public tbId: number) {
        this.chrId = chrId;
        this.tbId = tbId;
    }

    static createTables(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_ChrTBs (
            CHR_ID INT NOT NULL,
            TB_ID INT NOT NULL,
            FOREIGN KEY (CHR_ID) REFERENCES ${tableBaseName}_Characters(CHR_ID) ON DELETE CASCADE,
            FOREIGN KEY (TB_ID) REFERENCES ${tableBaseName}_TruthBullets(TB_ID) ON DELETE CASCADE);`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_ChrTBs\"\n${err.stack}`,
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
            `INSERT INTO ${tableBaseName}_ChrTBs (CHR_ID, TB_ID)
        VALUES ("${this.chrId}", "${this.tbId}");`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to add truth bullet (${this.tbId}) for \"${this.chrId}\" to \"${tableBaseName}_ChrTBs\"\n${err.stack}`,
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
            `DELETE FROM ${tableBaseName}_ChrTBs WHERE CHR_ID = '${this.chrId}' AND TB_ID = '${this.tbId}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete truth bullet (${this.tbId}) for \"${this.chrId}\" to \"${tableBaseName}_ChrTBs\"\n${err.stack}`,
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
                `SELECT * FROM ${tableBaseName}_ChrTBs WHERE CHR_ID = '${this.chrId}' AND TB_ID = '${this.tbId}';`,
                (err, res) => {
                    if (err || res.length > 1) {
                        LoggingFunctions.log(
                            `Unable to check if character \"${
                                this.chrId
                            }\" has truth bullet \"${this.tbId}\"\n${
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
