import DiscordJS, { EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { ActiveGame } from '../../activegame';

export class DRSkill{
    public id: number;
    public prereqs : string
    constructor(public name : string, prereqs : string | null, public desc : string, public spCost : number){
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.spCost = spCost;

        if(prereqs == null){
            this.prereqs = 'None'
        }else{
            this.prereqs = prereqs;
        }
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Skills ( 
            SKL_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Prereqs varchar(255),
            Description varchar(1000),
            SPCost SMALLINT,
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
                                            res[0].SPCost)
                retSkill.id = res[0].SKL_ID
                
                return resolve(retSkill)
            })
        })
    }

    static getAllSkills(db : mysql.Connection, tableBaseName : string): Promise<Array<DRSkill> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Skills;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<DRSkill>

                res.forEach((skill: { Name: string; Prereqs: string | null; Description: string; SPCost: number; SKL_ID: number; }) =>{
                let retSkill = new DRSkill(skill.Name, skill.Prereqs, skill.Description, skill.SPCost)
                retSkill.id = skill.SKL_ID

                retArr.push(retSkill)
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
                        **Prerequisites:** ${this.prereqs}\n
                        **SP Cost:** ${this.spCost}\n
                        **Description:** ${this.desc}`)
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()
    }

    static buildSummaryEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame, skills : Array<DRSkill> | null): EmbedBuilder | null{
        if(skills == null){
            return null
        }

        let embedBuilder = new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${activeGame.gameName} Skill Summary**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()

        let descStr = `**DM:** ${guild?.members.cache.get(activeGame.DM)}\n***(Cost) - Name:*** *Prereqs*\n`
        skills.forEach(skill => {
            descStr += `\n**(${skill.spCost}) - ${skill.name}:** ${skill.prereqs}`
        });

        embedBuilder.setDescription(descStr)

        return embedBuilder
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean {

        db.query(`INSERT INTO ${tableBaseName}_Skills (Name, Prereqs, Description, SPCost)
        VALUES ("${this.name}", "${this.prereqs}", "${this.desc}", "${this.spCost}");`, (err, res) =>  {
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