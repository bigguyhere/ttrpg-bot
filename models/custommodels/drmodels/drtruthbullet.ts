import DiscordJS, { EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { ActiveGame } from '../../activegame';

export class DRTruthBullet{
    public id: number;
    public trial : number;
    constructor(public name : string, 
                trial : number | null = null, 
                public desc : string = '', 
                public isUsed : boolean = false){
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.isUsed = isUsed;

        if(trial == null){
            this.trial = -1;
        }else{
            this.trial = trial;
        }
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_TruthBullets ( 
            TB_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Description varchar(1000),
            Trial INT,
            isUsed BOOLEAN,
            PRIMARY KEY (TB_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        DRChrTBs.createTables(db, tableNameBase)

        return true
    }

    static getTB(db : mysql.Connection, tableBaseName : string, tb_name : string, trial : number | null): Promise<DRTruthBullet | null>{
        return new Promise((resolve) =>{
            let trialStr = ''
            if(trial != null){
                trialStr = `AND Trial = "${trial}"`
            }

            db.query(`SELECT * FROM ${tableBaseName}_TruthBullets WHERE Name = "${tb_name}" ${trialStr};`, (err, res) =>  {
                if(err){
                    return resolve(null)
                } 
                
                let retTB = new DRTruthBullet(res[0].Name,
                                            res[0].Trial,
                                            res[0].Description,
                                            res[0].isUsed)
                retTB.id = res[0].TB_ID
                
                return resolve(retTB)
            })
        })
    }

    static getAllTBs(db : mysql.Connection, tableBaseName : string, trial : number | null, ): Promise<Array<DRTruthBullet> | null>{
        return new Promise((resolve) =>{
            let trialStr = ''
            if(trial != null){
                trialStr = `WHERE Trial = "${trial}"`
            }

            db.query(`SELECT * FROM ${tableBaseName}_TruthBullets ${trialStr};`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<DRTruthBullet>

                res.forEach((tb: { Name: string; Description: string; Trial: number | null; isUsed: boolean; TB_ID: number; }) =>{
                let retTB = new DRTruthBullet(tb.Name, tb.Trial, tb.Description, tb.isUsed)
                retTB.id = tb.TB_ID

                retArr.push(retTB)
                })

                return resolve(retArr)
            })
        })
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame): EmbedBuilder{
        
        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name} (ID: ${this.id}) Summary**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`**DM:** ${guild?.members.cache.get(activeGame.DM)}\n
                        **Trial:** ${this.trial == -1 ? '?': this.trial}\n
                        **Description:** ${this.desc}`)
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()
    }

    static buildSummaryEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame, 
        tbs : Array<DRTruthBullet> | null, paginationLimit : number = 10): EmbedBuilder[] | null{
        if(tbs == null){
            return null
        }

        let isDM = user.id === activeGame.DM

        let embeds : EmbedBuilder[] = []

        const numEmbeds = tbs.length > 0 ? Math.ceil(tbs.length / paginationLimit) : 1

        for(let i = 0; i < numEmbeds; ++i){
            embeds.push(new EmbedBuilder()
            .setColor(0x7852A9)
            .setTitle(`**${activeGame.gameName} Truth Bullet Summary ${isDM ? '(DM View)': '(Used View)'}**`)
            .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
            .setThumbnail(String(guild?.iconURL()))
            .setTimestamp())

            let descStr = `**DM:** ${guild?.members.cache.get(activeGame.DM)}\n\n**Truth Bullets:**\n`
            const curLimit = paginationLimit * (i + 1)
            const limit = curLimit > tbs.length ? tbs.length : curLimit
            for(let j = paginationLimit * i; j < limit; ++j){
                descStr += `**Trial ${tbs[j].trial == -1 ? '?': tbs[j].trial}:** *${tbs[j].name} (Used: ${tbs[j].isUsed ? 'Yes' : 'No'})* \n`
            }
            descStr += `\n\n**Total Truth Bullets:** ${tbs.length}`

            embeds[i].setDescription(descStr)
        }

        return embeds
    }

    isViewable(db: mysql.Connection, tableBaseName: string, owner: string) {
        return new Promise((resolve) =>{
            db.query(`SELECT DISTINCT TruthBullets.TB_ID FROM ${tableBaseName}_TruthBullets as TruthBullets
                        JOIN ${tableBaseName}_ChrTBs as ChrTBs
                        JOIN ${tableBaseName}_Characters as Characters 
                                            WHERE 
                                            Characters.Owner = '${owner}'
                                            AND Characters.CHR_ID = ChrTBs.CHR_ID
                                            AND ChrTBs.TB_ID = TruthBullets.TB_ID
                                            ORDER BY TruthBullets.TB_ID;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                for(const r of res){
                    if(r.TB_ID === this.id){
                        return resolve(true)
                    }
                }

                return resolve(false)
            })
        })
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`INSERT INTO ${tableBaseName}_TruthBullets (Name, Description, Trial, isUsed)
        VALUES ("${this.name}", "${this.desc}", "${this.trial}", ${this.isUsed});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }

            this.id = res.insertId
        })

        return true
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        let trialStr = ''
        if(this.trial != null){
            trialStr = `AND Trial = "${this.trial}"`
        }

        db.query(`DELETE FROM ${tableBaseName}_TruthBullets WHERE Name = '${this.name}' ${trialStr};`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    useTB(db : mysql.Connection, tableBaseName : string, value : boolean | null = null): boolean{
        let trialStr = this.trial == null ? '' : `AND Trial = ${this.trial}`
        let valueStr = value == null ? 'NOT isUsed' : String(value)
        
        db.query(`UPDATE ${tableBaseName}_TruthBullets SET isUsed = ${valueStr} WHERE Name = "${this.name}" ${trialStr};`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }
}

export class DRChrTBs{
    
    constructor(public chrId : number, public tbId : number){
        this.chrId = chrId;
        this.tbId = tbId;
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_ChrTBs (
            CHR_ID INT NOT NULL,
            TB_ID INT NOT NULL,
            FOREIGN KEY (CHR_ID) REFERENCES ${tableNameBase}_Characters(CHR_ID) ON DELETE CASCADE,
            FOREIGN KEY (TB_ID) REFERENCES ${tableNameBase}_TruthBullets(TB_ID) ON DELETE CASCADE);`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`INSERT INTO ${tableBaseName}_ChrTBs (CHR_ID, TB_ID)
        VALUES ("${this.chrId}", "${this.tbId}");`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`DELETE FROM ${tableBaseName}_ChrTBs WHERE CHR_ID = '${this.chrId}' AND TB_ID = '${this.tbId}';`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    //TODO: See if you can make a SQL query in future that can delete if exists and add if doesn't
    ifExists(db : mysql.Connection, tableBaseName : string): Promise<boolean | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_ChrTBs WHERE CHR_ID = '${this.chrId}' AND TB_ID = '${this.tbId}';`, (err, res) =>  {
                if(err || res.length > 1){
                    return resolve(null)
                } 
                
                return resolve(res.length == 1)
            })
        })
    }
}