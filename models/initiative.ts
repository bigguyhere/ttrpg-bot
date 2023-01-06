import mysql from 'mysql'
import { ActiveGame } from './activegame'

export class Initiative {
    constructor(public name: string,
                public rollValue: number,
                public isTurn : boolean,
                public HP : number | null,
                public user: string,
                public emote: string | null){
        this.name = name
        this.rollValue = rollValue
        this.isTurn = isTurn
        this.user = user,
        this.emote = emote
    }

    public static createTable(db : mysql.Connection, tableNameBase : string): boolean {

        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Initiative ( 
            Name varchar(255) NOT NULL,
            Roll SMALLINT NOT NULL,
            HP SMALLINT,
            isTurn BOOLEAN,
            User varchar(255) NOT NULL,
            Emote varchar(255),
            PRIMARY KEY (Name));`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    public static dropTable(db : mysql.Connection, tableNameBase : string): boolean {

        db.query(`DROP TABLE IF EXISTS ${tableNameBase}_Initiative;`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    public async addToTable(db : mysql.Connection, tableNameBase : string): Promise<boolean> {
        return new Promise((resolve) =>{
            db.query(`INSERT INTO ${tableNameBase}_Initiative (Name, Roll, HP, isTurn, User, Emote)
            VALUES ("${this.name}", ${this.rollValue}, ${this.HP}, ${this.isTurn}, "${this.user}", ${this.emote});`, (err, res) =>  {
                if(err){
                    if(err.errno == 1062){ // Duplicate Character
                        return resolve(false)
                    }
                    console.log(err)
                    throw err
                }

                return resolve(true)
            })
         })
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        db.query(`DELETE FROM ${tableBaseName}_Initiative WHERE Name = '${this.name}'`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    static getAllInitChrs(db : mysql.Connection, tableBaseName : string): Promise<Array<Initiative> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Initiative ORDER BY Roll DESC;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<Initiative>

                res.forEach((init: { Name: string; Roll: number; isTurn: boolean; HP: number; User: string; Emote: string | null }) =>{
                    let retInit = new Initiative(init.Name, init.Roll, init.isTurn, init.HP, init.User, init.Emote)
    
                    retArr.push(retInit)
                })
                
                return resolve(retArr)
            })
        })
    }

    private static getMaxChr(initChrs :Array<Initiative>): Initiative | null{
        return initChrs.length == 0 ? null : initChrs[0]
    }

    private static getActiveChrs(initChrs :Array<Initiative>): [Initiative, Initiative, boolean] | null{
        
        if(initChrs.length == 0){
            return null
        }

        for(let i = 0; i < initChrs.length; ++i){
            if(initChrs[i].isTurn){
                const j = (i == initChrs.length - 1) ? 0 : i + 1
                return [new Initiative(initChrs[i].name, initChrs[i].rollValue, 
                                initChrs[i].isTurn, initChrs[i].HP, initChrs[i].user, initChrs[i].emote),
                        new Initiative(initChrs[j].name, initChrs[j].rollValue, 
                                initChrs[j].isTurn, initChrs[j].HP, initChrs[j].user, initChrs[j].emote),
                        !(j == (i + 1))]
            }
        }

        return null
    }

    static updateInitChar(db : mysql.Connection, tableNameBase : string, activeChr: Initiative): Initiative{
        db.query(`UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChr.isTurn} WHERE Name = '${activeChr.name}';`
        , (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  

        activeChr.isTurn = !activeChr.isTurn

        return activeChr
    }

    static updateInitChars(db : mysql.Connection, tableNameBase : string, activeChrs :[Initiative, Initiative, boolean]): Initiative{
        db.query(`UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChrs[0].isTurn} WHERE Name = '${activeChrs[0].name}';
                UPDATE ${tableNameBase}_Initiative SET isTurn = ${!activeChrs[1].isTurn} WHERE Name = '${activeChrs[1].name}';`
        , (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  

        activeChrs[0].isTurn = !activeChrs[0].isTurn
        activeChrs[1].isTurn = !activeChrs[1].isTurn

        return activeChrs[1]
    }

    static async nextTurn(db : mysql.Connection, tableNameBase : string, activeGame : ActiveGame): Promise<Initiative | undefined>{
        let initChrs = await this.getAllInitChrs(db, tableNameBase)

        if(initChrs == null || initChrs.length == 0){
            return undefined
        }

        if(initChrs.length == 1){
            activeGame.updateInit(db, activeGame.channelID,
                                        activeGame.messageID,
                                        activeGame.defaultRoll,
                                        ++activeGame.round,
                                        ++activeGame.turn)
            initChrs[0].isTurn = false
            return Initiative.updateInitChar(db, tableNameBase, initChrs[0])
        }

        if(activeGame.turn == 0){
            activeGame.updateInit(db, activeGame.channelID,
                                        activeGame.messageID,
                                        activeGame.defaultRoll,
                                        ++activeGame.round,
                                        ++activeGame.turn)
            return Initiative.startInit(db, tableNameBase, initChrs)
        }

        let activeChrs = this.getActiveChrs(initChrs)

        if(activeChrs != null){
            activeGame.updateInit(db, activeGame.channelID,
                activeGame.messageID,
                activeGame.defaultRoll,
                activeChrs[2] ? ++activeGame.round : activeGame.round,
                ++activeGame.turn)
            
            return this.updateInitChars(db, tableNameBase, activeChrs)
        }

        return undefined
    }

    static startInit(db : mysql.Connection, tableNameBase : string, initChrs: Array<Initiative>) : Initiative | undefined{
        let maxChr = Initiative.getMaxChr(initChrs)

        if(maxChr == null){
            return undefined
        }

        return Initiative.updateInitChar(db, tableNameBase, maxChr)

    }

    public static async buildInitMsg(db : mysql.Connection, tableNameBase : string, activeGame : ActiveGame): Promise<string>{
        let retStr = `\`\`\`md\nRound: ${activeGame.round} (Turn: ${activeGame.turn})\n`
        retStr += '-'.repeat(retStr.length) + '\n'
        const allInitChrs = await Initiative.getAllInitChrs(db, tableNameBase)

        if(allInitChrs != null){
            allInitChrs.forEach(initChr => {
                retStr += `${initChr.isTurn ? '#' : ' '} ${initChr.rollValue}: ${initChr.name}\n`
            });
        }

        return retStr + '```'
    }
}