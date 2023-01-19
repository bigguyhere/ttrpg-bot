import DiscordJS, { Embed, EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { ActiveGame } from '../../activegame';

export class DRSkill{
    public id: number;
    public prereqs : string
    public Type : string
    constructor(public name : string, 
                prereqs : string | null = null, 
                public desc : string = '', 
                public spCost : number = -1,
                Type : string | null = null){
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.spCost = spCost;
        this.Type = Type == null ? 'Private' : Type;
        this.prereqs = prereqs == null ? 'None' : prereqs;
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Skills ( 
            SKL_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Prereqs varchar(255),
            Description varchar(2000),
            SPCost SMALLINT,
            Type varchar(3) NOT NULL,
            PRIMARY KEY (SKL_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        DRChrSkills.createTables(db, tableNameBase)

        return true
    }

    static getSkill(db : mysql.Connection, tableBaseName : string, skill_name : string): Promise<DRSkill | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Skills WHERE Name = "${skill_name}";`, (err, res) =>  {
                if(err || res.length != 1){
                    return resolve(null)
                } 
                
                let retSkill = new DRSkill(res[0].Name,
                                            res[0].Prereqs,
                                            res[0].Description,
                                            res[0].SPCost,
                                            res[0].Type)
                retSkill.id = res[0].SKL_ID
                
                return resolve(retSkill)
            })
        })
    }

    static getAllSkills(db : mysql.Connection, tableBaseName : string, 
        startIndex : number | null = null, endIndex : number | null = null): Promise<Array<DRSkill> | null>{
        return new Promise((resolve) =>{
            let queryStr = `SELECT * FROM ${tableBaseName}_Skills ORDER BY Name`
            if(startIndex != null){
                queryStr += `LIMIT ${startIndex}`
            }
            if(endIndex != null){
                queryStr += `, ${endIndex}`
            }
            queryStr += ';'

            db.query(queryStr, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<DRSkill>

                res.forEach((skill: { Name: string; Prereqs: string | null | undefined; Description: string | undefined;
                     SPCost: number | undefined; Type: string | undefined; SKL_ID: number; }) =>{
                let retSkill = new DRSkill(skill.Name, skill.Prereqs, skill.Description, skill.SPCost, skill.Type)
                retSkill.id = skill.SKL_ID

                retArr.push(retSkill)
                })

                return resolve(retArr)
            })
        })
    }

    isViewable(db : mysql.Connection, tableBaseName : string, owner : string, ): Promise<boolean | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT DISTINCT Skills.SKL_ID FROM ${tableBaseName}_Skills as Skills 
                        JOIN ${tableBaseName}_ChrSkills as ChrSkills
                        JOIN ${tableBaseName}_Characters as Characters 
                                            WHERE 
                                            Characters.Owner = '${owner}'
                                            AND Characters.CHR_ID = ChrSkills.CHR_ID
                                            AND ChrSkills.SKL_ID = Skills.SKL_ID
                                            AND Skills.Type != 'PUB'
                                            ORDER BY Skills.SKL_ID;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                for(const r of res){
                    if(r.SKL_ID === this.id){
                        return resolve(true)
                    }
                }

                return resolve(false)
            })
        })
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame): EmbedBuilder{
        
        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name} (ID: ${this.id}) Summary**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`**DM:** ${guild?.members.cache.get(activeGame.DM)}\n
                        **Prerequisites:** ${this.prereqs}\n
                        **SP Cost:** ${this.spCost}\n
                        **Description:** ${this.desc}`)
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()
    }

    static buildSummaryEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame, skills : Array<DRSkill> | null, paginationLimit : number = 10): EmbedBuilder[] | null{
        if(skills == null){
            return null
        }
        let embeds : EmbedBuilder[] = []

        for(let i = 0; i < Math.ceil(skills.length / paginationLimit); ++i){
            embeds.push(new EmbedBuilder()
            .setColor(0x7852A9)
            .setTitle(`**${activeGame.gameName} Public Skill Summary**`)
            .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
            .setThumbnail(String(guild?.iconURL()))
            .setTimestamp())

            let descStr = `**DM:** ${guild?.members.cache.get(activeGame.DM)}\n***(Cost) - Name:*** *Prereqs*\n`
            
            const curLimit = paginationLimit * (i + 1)
            const limit = curLimit > skills.length ? skills.length : curLimit
            for(let j = paginationLimit * i; j < limit; ++j){
                descStr += `\n**(${skills[j].spCost}) - ${skills[j].name}:** ${skills[j].prereqs}`
            }
    
            embeds[i].setDescription(descStr)

        }

        return embeds
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`INSERT INTO ${tableBaseName}_Skills (Name, Prereqs, Description, SPCost, Type)
        VALUES ("${this.name}", "${this.prereqs}", "${this.desc}", "${this.spCost}", "${this.Type}");`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }

            this.id = res.insertId
        })

        return true
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        db.query(`DELETE FROM ${tableBaseName}_Skills WHERE Name = '${this.name}';`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }
}

export class DRChrSkills{
    
    constructor(public chrId : number, public sklId : number){
        this.chrId = chrId;
        this.sklId = sklId;
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_ChrSkills (
            CHR_ID INT NOT NULL,
            SKL_ID INT NOT NULL,
            FOREIGN KEY (CHR_ID) REFERENCES ${tableNameBase}_Characters(CHR_ID) ON DELETE CASCADE,
            FOREIGN KEY (SKL_ID) REFERENCES ${tableNameBase}_Skills(SKL_ID) ON DELETE CASCADE);`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`INSERT INTO ${tableBaseName}_ChrSkills (CHR_ID, SKL_ID)
        VALUES ("${this.chrId}", "${this.sklId}");`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`DELETE FROM ${tableBaseName}_ChrSkills WHERE CHR_ID = '${this.chrId}' AND SKL_ID = '${this.sklId}';`, (err, res) =>{
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
            db.query(`SELECT * FROM ${tableBaseName}_ChrSkills WHERE CHR_ID = '${this.chrId}' AND SKL_ID = '${this.sklId}';`, (err, res) =>  {
                if(err || res.length > 1){
                    return resolve(null)
                } 
                
                return resolve(res.length == 1)
            })
        })
    }
}