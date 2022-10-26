import DiscordJS, { Embed, EmbedBuilder } from 'discord.js';
import mysql from 'mysql'

interface Model{

}

class Character {
    public id: number;
    public prounouns: string;
    public health: number;
    constructor(public name: string, prounouns: string | null, public owner: string, health: number | null, public dmgTaken : number, public otherStats : Array<[string, string]>) {
        this.id = -1;
        this.name = name;
        this.owner = owner;
        this.dmgTaken = dmgTaken;
        this.otherStats = otherStats

        if(prounouns === null){
            this.prounouns = 'they/them'
        } else{
            this.prounouns = prounouns;
        }

        if(health === null){
            this.health = 0;
        }else{
            this.health = health;
        }
    }

    static createTable(db : mysql.Connection, tableNameBase : string, additionalStats : Array<[string, string]>): boolean {
        let queryStr = `CREATE TABLE IF NOT EXISTS ${tableNameBase}_Characters ( 
            CHR_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Pronouns varchar(255),
            Owner varchar(255),
            Health SMALLINT,
            DmgTaken SMALLINT,`

            additionalStats.forEach(stat =>{
                queryStr += `${stat[0]} ${stat[1]},\n`
            })

            queryStr += 'PRIMARY KEY (CHR_ID));'
        
        db.query(queryStr, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            console.log(queryStr)
            console.log(res)
        })

        return true
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean{
        let queryStr = `INSERT INTO ${tableBaseName}_Characters (Name, Pronouns, Owner, Health, DmgTaken`
        let valuesStr = `VALUES ("${this.name}", "${this.prounouns}", "${this.owner}", ${this.health}, ${this.dmgTaken}`

        this.otherStats.forEach(stat =>{
            queryStr += `, ${stat[0]}`
            valuesStr += `, "${stat[1]}"`
        })

        queryStr += ')'
        valuesStr += ');'
        
        db.query(`${queryStr}\n${valuesStr}`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }

        })

        return true
    }

    static parseColumns(columns : string | null): Array<[string,string]> | undefined{
        if(columns == null || columns === 'null'){
            return []
        }
        
        let retArr = new Array<[string, string]>

        let colsArr = columns.split(',')

        colsArr.forEach(col =>{
            col = col.trim()

            let statData = col.split('|')

            if(statData.length == 1){
                statData.push('varchar(255)')
            } 

            if(statData.length != 2){
                return undefined
            }

            retArr.push([statData[0].trim().replace(/ /g, '_'), statData[1]])
        })

        return retArr
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        db.query(`DELETE FROM ${tableBaseName}_Characters WHERE Name='${this.name}'`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    static getCharacter(db : mysql.Connection, tableBaseName : string, char_name : string): Promise<Character | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`, (err, res) =>  {
                if(err || res.length != 1){
                    console.log(err)
                    return resolve(null)
               } 

            db.query(`SHOW COLUMNS FROM ${tableBaseName}_Characters;`, (errr, ress) =>{
                if(errr){
                    console.log(errr)
                    return resolve(null)
                } 

                let stats = new Array<[string, string]>
                let baseStats = ['CHR_ID', 'Name', 'Pronouns', 'Owner', 'Health', 'DmgTaken']

                ress.forEach((stat: { Field: string; Type: string; }) => {
                    if(!baseStats.includes(stat.Field)){
                        stats.push([stat.Field, String(eval(`res[0].${stat.Field}`))])
                    }
                });

                return resolve(new Character(res[0].Name, res[0].Pronouns, res[0].Owner, res[0].Health, res[0].DmgTaken, stats))
            })
           })
        })
    }

    buildEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | undefined): EmbedBuilder{

        const owner = guild?.members.cache.get(this.owner)
        let embedBuilder = new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`${this.prounouns}`)
        .setThumbnail(String(owner?.displayAvatarURL()))
        .addFields(
            { name: '**Owner:**', value: String(owner) },
		    { name: '\u200B', value: '\u200B' },
        )
        .setTimestamp()

        this.otherStats.forEach(stat =>{
            embedBuilder.addFields({ name: stat[0], value: stat[1]})
        })

        return embedBuilder
    }

    getCurrentHealth(): number{
        return this.health - this.dmgTaken;
    }

    getPronoun( pronounNum : number): string{
        return this.prounouns.split('/')[pronounNum]
    }
}

class DRCharacter extends Character {
    public hope : number;
    public despair : number;
    public spTotal : number;
    public spUsed : number;

    constructor(
         name: string,
         prounouns: string | null,
         owner : string,
         public talent : string | null,
         public brains : number,
         public brawn : number,
         public nimble : number, 
         public social : number, 
         public intuition : number,
         public skills : Array<number> | null) {
            
            super(name, prounouns, owner, brawn + 5, 0, []);

            this.talent = talent;
            this.hope = 0;
            this.despair = 0;
            this.brains = brains;
            this.brawn = brawn;
            this.nimble = nimble;
            this.social = social;
            this.intuition = intuition;
            this.skills = skills;
            this.spTotal = 15;
            this.spUsed = 0;
    }

    static createTable(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`ALTER TABLE ${tableNameBase}_Characters 
            ADD Talent varchar(255),
            ADD Hope TINYINT,
            ADD Despair TINYINT,
            ADD Brains TINYINT,
            ADD Brawn TINYINT,
            ADD Nimble TINYINT,
            ADD Social TINYINT,
            ADD Intuition TINYINT,
            ADD SPTotal TINYINT,
            ADD SPUsed TINYINT`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }

    //TODO: Rewrite this method to just call it's parent's addToTable method with the additional dr columns as additional cols (Will allow for less commands)
    addToTable(db : mysql.Connection, tableBaseName : string): boolean{
       
        let talent
        if(this.talent != null){
            talent = `"${this.talent}"` 
        }else{
            talent = "null"
        }

        db.query(`INSERT INTO ${tableBaseName}_Characters (Name, Pronouns, Owner, Health, DmgTaken, Talent, Hope, Despair, Brains, Brawn, Nimble, Social, Intuition, SPTotal, SPUsed)
        VALUES ("${this.name}", "${this.prounouns}", "${this.owner}", ${this.health}, ${this.dmgTaken}, ${talent}, ${this.hope}, ${this.despair}, ${this.brains}, ${this.brawn}, ${this.nimble}, ${this.social}, ${this.intuition}, ${this.spTotal}, ${this.spUsed});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    static getCharacter(db : mysql.Connection, tableBaseName : string, char_name : string): Promise<Character | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`, (err, res) =>  {
                if(err || res.length != 1){
                   return resolve(null)
               } 
               
               return resolve(new DRCharacter(res[0].Name, res[0].Pronouns, res[0].Owner, res[0].Talent, res[0].Brains, res[0].Brawn, res[0].Nimble, res[0].Social, res[0].Intuition, []))
           })
        })
    }

    buildEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | undefined): EmbedBuilder{

        const owner = guild?.members.cache.get(this.owner)
        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`${this.talent}\n${this.prounouns}`)
        .setThumbnail(String(owner?.displayAvatarURL()))
        .addFields(
            { name: '**Owner:**', value: String(owner) },
		    { name: '\u200B', value: '\u200B' },
            { name: 'Brains', value: String(this.brains), inline: true },
            { name: 'Brawn', value: String(this.brawn), inline: true },
            { name: 'Nimble', value: String(this.nimble), inline: true },
            { name: 'Social', value: String(this.social), inline: true },
            { name: 'Intuition', value: String(this.intuition), inline: true },
            { name: 'SP Used', value: String(this.spUsed), inline: true }
        )
        .setTimestamp()
    }

    addSkill(skilSignifier : any) : boolean{
        return true;
    }

    addTB(tbSignifier : any) : boolean{
        return true;
    }
}

class DRRelationship {
    public value: number;
    public char1 : DRCharacter;
    public char2 : DRCharacter; 

    constructor(
        public signifier1: any,
        public signifier2: any){
        
        this.char1 = new DRCharacter('', '', '', '', 0, 0, 0, 0, 0, []);
        this.char2 = new DRCharacter('', '', '', '', 0, 0, 0, 0, 0, []);
        this.value = 0;
    }

    /*findChr() : Character{
        
    }*/

    getRelationshipLvl() : string{
        return ''
    }
}

class DRSkill{
    public id: number;
    constructor(public name : string, public prereqs : string, public spCost : number){
        this.id = -1;
        this.name = name;
        this.prereqs = prereqs;
        this.spCost = spCost;
    }

    static createTables(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Skills ( 
            SKL_ID INT NOT NULL AUTO_INCREMENT,
            Name varchar(255) NOT NULL,
            Prereqs varchar(255),
            SPCost SMALLINT,
            PRIMARY KEY (SKL_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_ChrSkills (
            CHR_ID INT NOT NULL,
            SKL_ID INT NOT NULL,
            FOREIGN KEY (CHR_ID) REFERENCES ${tableNameBase}_Characters(CHR_ID),
            FOREIGN KEY (SKL_ID) REFERENCES ${tableNameBase}_Skills(SKL_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }
}

class DRTruthBullet{
    public id: number;
    constructor(public name : string, public desc : string, public assignedChrs : Array<number>){
        this.id = -1;
        this.name = name;
        this.desc = desc;
        this.assignedChrs = assignedChrs;
    }
}

class ActiveGame{


    constructor(public serverID : string | null, public gameName : string | undefined, public gameType : string | null, public DM : string, public isActive : boolean){
        this.serverID = serverID;
        this.gameName = gameName;
        this.gameType = gameType;
        this.DM = DM;
        this.isActive = isActive;
    }

    static createTable(db : mysql.Connection, dbName : string): boolean {

        db.query(`CREATE TABLE IF NOT EXISTS ${dbName}.ActiveGames ( 
            SERV_ID varchar(255) NOT NULL,
            GameName varchar(255) NOT NULL,
            GameType varchar(255),
            DM varchar(255) NOT NULL,
            isActive BOOLEAN,
            PRIMARY KEY (SERV_ID, GameName));`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    addToTable(db : mysql.Connection, dbName : string): boolean{

        //Sets currently active game(s) to inactive
        db.query(`UPDATE ${dbName}.ActiveGames SET isActive = 0 WHERE isActive = 1 and SERV_ID = ${this.serverID};`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  

        //Inserts new game to the game table, set as the active game
        db.query(`INSERT INTO ${dbName}.ActiveGames (SERV_ID, GameName, GameType, DM, isActive)
        VALUES (${this.serverID}, "${this.gameName}", "${this.gameType}", ${this.DM}, ${this.isActive});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    static getCurrentGame(db : mysql.Connection, dbName : string, serverID : string | null) : Promise<ActiveGame | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${dbName}.ActiveGames WHERE isActive = 1 AND SERV_ID = '${serverID}';`, (err, res) =>  {
                if(err || res.length != 1){
                   return resolve(null)
               } 
               
               return resolve(new ActiveGame(res[0].SERV_ID, res[0].GameName, res[0].GameType, res[0].DM, res[0].isActive))
           })
        })
    }

}

export { Character, DRCharacter, DRRelationship, DRSkill, DRTruthBullet, ActiveGame}