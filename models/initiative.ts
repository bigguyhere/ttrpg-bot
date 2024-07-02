import mysql, { Connection, Pool, RowDataPacket } from "mysql2";
import { ActiveGame } from "./activegame";
import { IInitiativeObj } from "./objectDefs";
import { LogLevel, LoggingFunctions, SeverityLevel } from "../utility/logging";

export class Initiative {
    constructor(
        public name: string,
        public rollValue: number = -1,
        public emote: string | null = null,
        public user: string = "",
        public isTurn: boolean = false,
        public HP: number | null = 0,
        public Dmg: number = 0
    ) {
        this.name = name;
        this.rollValue = rollValue;
        this.isTurn = isTurn;
        (this.user = user), (this.emote = emote);
        this.HP = HP;
        this.Dmg = Dmg;
    }

    public static createTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_Initiative ( 
            Name varchar(255) NOT NULL,
            Roll SMALLINT NOT NULL,
            HP SMALLINT,
            Dmg SMALLINT NOT NULL,
            isTurn BOOLEAN,
            User varchar(255) NOT NULL,
            Emote varchar(255),
            PRIMARY KEY (Name));`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }

    public static dropTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DROP TABLE IF EXISTS ${tableBaseName}_Initiative;`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to drop table \"${this.name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    public async addToTable(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            db.execute(
                `INSERT INTO ${tableBaseName}_Initiative (Name, Roll, HP, Dmg, isTurn, User, Emote)
            VALUES ("${this.name}", ${this.rollValue}, ${this.HP}, ${this.Dmg}, ${this.isTurn}, "${this.user}", "${this.emote}");`,
                (err, res) => {
                    if (err) {
                        if (err.errno == 1062) {
                            // Duplicate Character
                            LoggingFunctions.log(
                                `Unable to add character \"${this.name}\" to \"${tableBaseName}_Initiative\" (Character has already been added to initiative)\n${err.stack}`,
                                LogLevel.WARNING,
                                SeverityLevel.LOW
                            );
                            return resolve(false);
                        }
                        LoggingFunctions.log(
                            `Unable to add character \"${this.name}\" to \"${tableBaseName}_Initiative\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        throw err;
                    }

                    return resolve(true);
                }
            );
        });
    }

    removeFromTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DELETE FROM ${tableBaseName}_Initiative WHERE Name = '${this.name}'`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to delete character \"${this.name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    updateDMG(db: Connection | Pool, tableBaseName: string, value: number) {
        db.execute(
            `UPDATE ${tableBaseName}_Initiative SET Dmg = Dmg+${value} WHERE Name = '${this.name}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to update initiative health/damage for \"${this.name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    static getAllInitChrs(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<Array<Initiative> | null> {
        return new Promise((resolve) => {
            db.execute<IInitiativeObj[]>(
                `SELECT * FROM ${tableBaseName}_Initiative ORDER BY Roll DESC;`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to get all initiative characters from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(null);
                    }

                    let retArr = new Array<Initiative>();

                    res.forEach((init) => {
                        let retInit = new Initiative(
                            init.Name,
                            init.Roll,
                            init.Emote,
                            init.User,
                            init.isTurn,
                            init.HP,
                            init.Dmg
                        );

                        retArr.push(retInit);
                    });

                    return resolve(retArr);
                }
            );
        });
    }

    static getInitChr(
        db: Connection | Pool,
        tableBaseName: string,
        chrName: string
    ): Promise<Initiative | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Initiative WHERE Name = '${chrName}'`,
                (err, res) => {
                    if (err || res.length != 1) {
                        LoggingFunctions.log(
                            `Unable to get initiative character \"${chrName}\" from \"${tableBaseName}_Initiative\"\n${
                                res.length === 1
                                    ? err?.stack
                                    : `Multiple values (${res.length}) returned.`
                            }`,
                            LogLevel.ERROR,
                            SeverityLevel.LOW
                        );
                        return resolve(null);
                    }

                    return resolve(
                        new Initiative(
                            res[0].Name,
                            res[0].Roll,
                            res[0].isTurn,
                            res[0].Dmg,
                            res[0].HP,
                            res[0].User,
                            res[0].Emote
                        )
                    );
                }
            );
        });
    }

    private static getMaxChr(initChrs: Array<Initiative>): Initiative | null {
        return initChrs.length == 0 ? null : initChrs[0];
    }

    private static getActiveChrs(
        initChrs: Array<Initiative>
    ): [Initiative, Initiative, boolean] | null {
        if (initChrs.length == 0) {
            LoggingFunctions.log(
                `No characters in initative`,
                LogLevel.WARNING,
                SeverityLevel.LOW
            );
            return null;
        }

        for (let i = 0; i < initChrs.length; ++i) {
            if (initChrs[i].isTurn) {
                const j = i == initChrs.length - 1 ? 0 : i + 1;
                return [
                    new Initiative(
                        initChrs[i].name,
                        initChrs[i].rollValue,
                        initChrs[i].emote,
                        initChrs[i].user,
                        initChrs[i].isTurn,
                        initChrs[i].HP,
                        initChrs[i].Dmg
                    ),
                    new Initiative(
                        initChrs[j].name,
                        initChrs[j].rollValue,
                        initChrs[j].emote,
                        initChrs[j].user,
                        initChrs[j].isTurn,
                        initChrs[j].HP,
                        initChrs[j].Dmg
                    ),
                    !(j == i + 1),
                ];
            }
        }

        return null;
    }

    static updateInitChar(
        db: Connection | Pool,
        tableBaseName: string,
        activeChr: Initiative
    ): Initiative {
        db.execute(
            `UPDATE ${tableBaseName}_Initiative SET isTurn = ${!activeChr.isTurn} WHERE Name = '${
                activeChr.name
            }';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to update turn for character \"${activeChr.name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );

        activeChr.isTurn = !activeChr.isTurn;

        return activeChr;
    }

    static updateInitChars(
        db: Connection | Pool,
        tableBaseName: string,
        activeChrs: [Initiative, Initiative, boolean]
    ): Initiative {
        db.execute(
            `UPDATE ${tableBaseName}_Initiative SET isTurn = ${!activeChrs[0]
                .isTurn} WHERE Name = '${activeChrs[0].name}';
                UPDATE ${tableBaseName}_Initiative SET isTurn = ${!activeChrs[1]
                .isTurn} WHERE Name = '${activeChrs[1].name}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to update turns for characters \"${activeChrs[0].name}\" and \"${activeChrs[1].name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );

        activeChrs[0].isTurn = !activeChrs[0].isTurn;
        activeChrs[1].isTurn = !activeChrs[1].isTurn;

        return activeChrs[1];
    }

    changeInit(db: Connection | Pool, tableBaseName: string): Promise<boolean> {
        return new Promise((resolve) => {
            db.execute(
                `UPDATE ${tableBaseName}_Initiative SET isTurn = false;
                    UPDATE ${tableBaseName}_Initiative SET isTurn = true WHERE Name = '${this.name}';`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to update turn for character \"${this.name}\" from \"${tableBaseName}_Initiative\"\n${err.stack}`,
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

    static async nextTurn(
        db: Connection | Pool,
        tableBaseName: string,
        activeGame: ActiveGame
    ): Promise<Initiative | undefined> {
        let initChrs = await this.getAllInitChrs(db, tableBaseName);

        if (initChrs == null || initChrs.length == 0) {
            LoggingFunctions.log(
                `No initiative characters obtained from \"${tableBaseName}_Initiative\"`,
                LogLevel.WARNING,
                SeverityLevel.LOW
            );
            return undefined;
        }

        if (initChrs.length == 1) {
            activeGame.updateInit(
                db,
                activeGame.channelID,
                activeGame.messageID,
                activeGame.defaultRoll,
                ++activeGame.round,
                ++activeGame.turn,
                activeGame.hideHP
            );
            initChrs[0].isTurn = false;
            return Initiative.updateInitChar(db, tableBaseName, initChrs[0]);
        }

        if (activeGame.turn == 0) {
            activeGame.updateInit(
                db,
                activeGame.channelID,
                activeGame.messageID,
                activeGame.defaultRoll,
                ++activeGame.round,
                ++activeGame.turn,
                activeGame.hideHP
            );
            return Initiative.startInit(db, tableBaseName, initChrs);
        }

        let activeChrs = this.getActiveChrs(initChrs);

        if (activeChrs != null) {
            activeGame.updateInit(
                db,
                activeGame.channelID,
                activeGame.messageID,
                activeGame.defaultRoll,
                activeChrs[2] ? ++activeGame.round : activeGame.round,
                ++activeGame.turn,
                activeGame.hideHP
            );

            return this.updateInitChars(db, tableBaseName, activeChrs);
        }

        return undefined;
    }

    static startInit(
        db: Connection | Pool,
        tableBaseName: string,
        initChrs: Array<Initiative>
    ): Initiative | undefined {
        let maxChr = Initiative.getMaxChr(initChrs);

        if (maxChr == null) {
            LoggingFunctions.log(
                `Unable to obtain max character in initative for \"${tableBaseName}_Initiative\"`,
                LogLevel.ERROR,
                SeverityLevel.MEDIUM
            );

            return undefined;
        }

        return Initiative.updateInitChar(db, tableBaseName, maxChr);
    }

    public static async buildInitMsg(
        db: Connection | Pool,
        tableBaseName: string,
        activeGame: ActiveGame
    ): Promise<string> {
        let retStr = `\`\`\`md\nRound: ${activeGame.round} (Turn: ${activeGame.turn})\n`;
        retStr += "-".repeat(retStr.length) + "\n";
        const allInitChrs = await Initiative.getAllInitChrs(db, tableBaseName);

        if (allInitChrs != null) {
            allInitChrs.forEach((initChr) => {
                retStr += `${initChr.isTurn ? "#" : " "} ${
                    initChr.rollValue
                }: ${initChr.name}`;
                retStr +=
                    initChr.HP == null || activeGame.hideHP
                        ? ""
                        : ` <${initChr.HP - initChr.Dmg}/${initChr.HP} HP>`;
                retStr += "\n";
            });
        }

        return retStr + "```";
    }
}
