import mysql, { RowDataPacket } from "mysql2";
import { ActiveGame } from "./activegame";
import { IInitiativeObj } from "./objectDefs";

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

    public static createTable(db: mysql.Connection, tableNameBase: string) {
        db.query(
            `CREATE TABLE IF NOT EXISTS ${tableNameBase}_Initiative ( 
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
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    public static dropTable(db: mysql.Connection, tableNameBase: string) {
        db.query(
            `DROP TABLE IF EXISTS ${tableNameBase}_Initiative;`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    public async addToTable(
        db: mysql.Connection,
        tableNameBase: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            db.query(
                `INSERT INTO ${tableNameBase}_Initiative (Name, Roll, HP, Dmg, isTurn, User, Emote)
            VALUES ("${this.name}", ${this.rollValue}, ${this.HP}, ${this.Dmg}, ${this.isTurn}, "${this.user}", "${this.emote}");`,
                (err, res) => {
                    if (err) {
                        if (err.errno == 1062) {
                            // Duplicate Character
                            return resolve(false);
                        }
                        console.log(err);
                        throw err;
                    }

                    return resolve(true);
                }
            );
        });
    }

    removeFromTable(db: mysql.Connection, tableBaseName: string) {
        db.query(
            `DELETE FROM ${tableBaseName}_Initiative WHERE Name = '${this.name}'`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    updateDMG(db: mysql.Connection, tableBaseName: string, value: number) {
        db.query(
            `UPDATE ${tableBaseName}_Initiative SET Dmg = Dmg+${value} WHERE Name = '${this.name}';`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    static getAllInitChrs(
        db: mysql.Connection,
        tableBaseName: string
    ): Promise<Array<Initiative> | null> {
        return new Promise((resolve) => {
            db.query<IInitiativeObj[]>(
                `SELECT * FROM ${tableBaseName}_Initiative ORDER BY Roll DESC;`,
                (err, res) => {
                    if (err) {
                        console.log(err);
                        return resolve(null);
                    }

                    let retArr = new Array<Initiative>();

                    res.forEach(
                        (init: {
                            Name: string;
                            Roll: number;
                            isTurn: boolean;
                            HP: number;
                            Dmg: number;
                            User: string;
                            Emote: string | null;
                        }) => {
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
                        }
                    );

                    return resolve(retArr);
                }
            );
        });
    }

    static getInitChr(
        db: mysql.Connection,
        tableBaseName: string,
        chrName: string
    ): Promise<Initiative | null> {
        return new Promise((resolve) => {
            db.query<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Initiative WHERE Name = '${chrName}'`,
                (err, res) => {
                    if (err || res.length != 1) {
                        console.log(err);
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
        db: mysql.Connection,
        tableNameBase: string,
        activeChr: Initiative
    ): Initiative {
        db.query(
            `UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChr.isTurn} WHERE Name = '${
                activeChr.name
            }';`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );

        activeChr.isTurn = !activeChr.isTurn;

        return activeChr;
    }

    static updateInitChars(
        db: mysql.Connection,
        tableNameBase: string,
        activeChrs: [Initiative, Initiative, boolean]
    ): Initiative {
        db.query(
            `UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChrs[0]
                .isTurn} WHERE Name = '${activeChrs[0].name}';
                UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChrs[1]
                .isTurn} WHERE Name = '${activeChrs[1].name}';`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );

        activeChrs[0].isTurn = !activeChrs[0].isTurn;
        activeChrs[1].isTurn = !activeChrs[1].isTurn;

        return activeChrs[1];
    }

    changeInit(
        db: mysql.Connection,
        tableNameBase: string,
        activeGame: ActiveGame
    ): Promise<boolean> {
        return new Promise((resolve) => {
            db.query(
                `UPDATE ${tableNameBase}_Initiative SET isTurn = false;
                    UPDATE ${tableNameBase}_Initiative SET isTurn = true WHERE Name = '${this.name}';`,
                (err, res) => {
                    if (err) {
                        console.log(err);
                        return resolve(false);
                    }

                    return resolve(true);
                }
            );
        });
    }

    static async nextTurn(
        db: mysql.Connection,
        tableNameBase: string,
        activeGame: ActiveGame
    ): Promise<Initiative | undefined> {
        let initChrs = await this.getAllInitChrs(db, tableNameBase);

        if (initChrs == null || initChrs.length == 0) {
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
            return Initiative.updateInitChar(db, tableNameBase, initChrs[0]);
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
            return Initiative.startInit(db, tableNameBase, initChrs);
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

            return this.updateInitChars(db, tableNameBase, activeChrs);
        }

        return undefined;
    }

    static startInit(
        db: mysql.Connection,
        tableNameBase: string,
        initChrs: Array<Initiative>
    ): Initiative | undefined {
        let maxChr = Initiative.getMaxChr(initChrs);

        if (maxChr == null) {
            return undefined;
        }

        return Initiative.updateInitChar(db, tableNameBase, maxChr);
    }

    public static async buildInitMsg(
        db: mysql.Connection,
        tableNameBase: string,
        activeGame: ActiveGame
    ): Promise<string> {
        let retStr = `\`\`\`md\nRound: ${activeGame.round} (Turn: ${activeGame.turn})\n`;
        retStr += "-".repeat(retStr.length) + "\n";
        const allInitChrs = await Initiative.getAllInitChrs(db, tableNameBase);

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
