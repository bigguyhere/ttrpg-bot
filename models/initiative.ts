import mysql from 'mysql'
import { ActiveGame } from './activegame'

export class Initiative {
    public initID: number
    constructor(public name: string,
                public rollValue: number,
                public isTurn : boolean,){
        this.initID = -1
        this.name = name
        this.rollValue = rollValue
        this.isTurn = isTurn
    }

    public static createTable(db : mysql.Connection, tableNameBase : string): boolean {

        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Initiative ( 
            Name varchar(255) NOT NULL,
            Roll INT NOT NULL,
            isTurn BOOLEAN,
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

    static getAllInitChrs(db : mysql.Connection, tableBaseName : string): Promise<Array<Initiative> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Initiative SORT BY Roll;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<Initiative>

                res.forEach((init: { Name: string; Roll: number; isTurn: boolean }) =>{
                    let retInit = new Initiative(init.Name, init.Roll, init.isTurn)
    
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
                const j = (i == initChrs.length) ? 0 : i + 1
                return [new Initiative(initChrs[i].name, initChrs[i].rollValue, initChrs[i].isTurn),
                                new Initiative(initChrs[j].name, initChrs[j].rollValue, initChrs[j].isTurn),
                                !(j == (i + 1))]
            }
        }

        return null
    }

    static updateInitChars(db : mysql.Connection, tableNameBase : string, activeChrs :[Initiative, Initiative, boolean]){
        db.query(`UPDATE ${tableNameBase}_Initiative SET isTurn = '${!activeChrs[0].isTurn}' WHERE Name = '${activeChrs[0].name}';
                \nUPDATE ${tableNameBase}_Initiative SET isTurn = '${!activeChrs[1].isTurn}' WHERE Name = '${activeChrs[1].name}';`
        , (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }

    static updateInitChar(db : mysql.Connection, tableNameBase : string, activeChr: Initiative){
        db.query(`UPDATE ${tableNameBase}_Initiative SET isTurn = '${!activeChr.isTurn}' WHERE Name = '${activeChr.name}';`
        , (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }

    static async nextTurn(db : mysql.Connection, tableNameBase : string, activeGame : ActiveGame): Promise<boolean>{
        let initChrs = await this.getAllInitChrs(db, tableNameBase)

        if(initChrs == null){
            return false
        }

        if(activeGame.turn == 0){
            Initiative.startInit(db, tableNameBase, initChrs)
            return activeGame.updateInitiative(db, true)
        }

        let activeChrs = this.getActiveChrs(initChrs)

        if(activeChrs != null){
            this.updateInitChars(db, tableNameBase, activeChrs)
            
            return activeGame.updateInitiative(db, activeChrs[2])
        }

        return false
    }

    static startInit(db : mysql.Connection, tableNameBase : string, initChrs: Array<Initiative>) : boolean{
        let maxChr = Initiative.getMaxChr(initChrs)

        if(maxChr == null){
            return false
        }

        Initiative.updateInitChar(db, tableNameBase, maxChr)

        return true
    }

    public static async buildInitMsg(db : mysql.Connection, tableNameBase : string, activeGame : ActiveGame): Promise<string>{
        let retStr = `\`\`\` Round: ${activeGame.round} (Turn: ${activeGame.turn})\n`
        const allInitChrs = await Initiative.getAllInitChrs(db, tableNameBase)

        if(allInitChrs != null){
            allInitChrs.forEach(initChr => {
                retStr += `${initChr.isTurn ? '#' : ' '} ${initChr.rollValue}: ${initChr.name}\n`
            });
        }

        return retStr + '```'
    }

    public async addToTable(db : mysql.Connection, tableNameBase : string): Promise<boolean> {
        db.query(`INSERT INTO ${tableNameBase}_Initiative (Name, Roll, isTurn)
        VALUES (${this.name}, "${this.rollValue}", "${this.isTurn}");`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
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


}