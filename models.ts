import DiscordJS, { Embed, EmbedBuilder, GuildEmoji, TextBasedChannelMixin } from 'discord.js';
import mysql from 'mysql'

interface Model{

}

class Character {
    public id: number;
    public prounouns: string;
    public health: number;
    constructor(public name: string, public emote: string | null, prounouns: string | null, public owner: string, health: number | null, public dmgTaken : number, public otherStats : Array<[string, string]>) {
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
            Emote varchar(255),
            Pronouns varchar(255) NOT NULL,
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
        })

        return true
    }

    addToTable(db : mysql.Connection, tableBaseName : string): boolean{
        let queryStr = `INSERT INTO ${tableBaseName}_Characters (Name, Emote, Pronouns, Owner, Health, DmgTaken`
        let valuesStr = `VALUES ("${this.name}", "${this.emote}", "${this.prounouns}", "${this.owner}", ${this.health}, ${this.dmgTaken}`

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

    updateStat(db : mysql.Connection, tableBaseName : string, statName : string, statValue : string): boolean{
        if(statName.toUpperCase() === 'NAME'){
            return false
        }

        db.query(`UPDATE ${tableBaseName}_Characters SET ${statName} = '${statValue}' WHERE Name = '${this.name}';`, (err, res) => {
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
                let baseStats = ['CHR_ID', 'Name', 'Emote', 'Pronouns', 'Owner', 'Health', 'DmgTaken']

                ress.forEach((stat: { Field: string; Type: string; }) => {
                    if(!baseStats.includes(stat.Field)){
                        stats.push([stat.Field, String(eval(`res[0].${stat.Field}`))])
                    }
                });

                let retChr = new Character(res[0].Name, res[0].Emote, res[0].Pronouns, res[0].Owner, res[0].Health, res[0].DmgTaken, stats)
                retChr.id = res[0].CHR_ID

                return resolve(retChr)
            })
           })
        })
    }

    static getAllCharacters(db : mysql.Connection, tableBaseName : string): Promise<Array<Character> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Characters;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
               } 

               let retArr = new Array<Character>

               res.forEach((char: { CHR_ID: number; Name: string; Emote: string | null; Pronouns: string | null; Owner: string; Health: number | null; DmgTaken: number; }) =>{
                let retChr = new Character(char.Name, char.Emote, char.Pronouns, char.Owner, char.Health, char.DmgTaken, [])
                retChr.id = char.CHR_ID

                retArr.push(retChr)
               })

               return resolve(retArr)
           })
        })
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null): EmbedBuilder{

        let thumbnail = guild?.emojis.cache.get(String(this.emote))?.url
        const owner = guild?.members.cache.get(this.owner)

        if(thumbnail == undefined){
            thumbnail = String(owner?.displayAvatarURL())
        }

        let embedBuilder = new EmbedBuilder()
        .setColor(owner?.displayHexColor as DiscordJS.ColorResolvable)
        .setTitle(`**${this.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`${this.prounouns}`)
        .setThumbnail(thumbnail)
        .addFields(
            { name: '**Owner:**', value: String(owner) },
		    { name: '\u200B', value: '\u200B' },
            { name: '**Health**', value: String(this.getCurrentHealth()) , inline: true},
        )
        .setTimestamp()

        this.otherStats.forEach(stat =>{
            embedBuilder.addFields({ name: stat[0], value: stat[1], inline: true})
        })

        return embedBuilder
    }

    static buildSummaryEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame: ActiveGame, chars : Array<Character> | null): EmbedBuilder | null{

        if(chars == null){
            return null
        }

        let embedBuilder = new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${activeGame.gameName} Summary**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()

        let descStr = `**DM:** ${guild?.members.cache.get(activeGame.DM)}\n`
        chars.forEach(char => {
            let emoteStr
            if(char.emote?.length != 2){
                let emote = guild?.emojis.cache.get(String(char.emote))
                emoteStr = emote == undefined ? '' : `<:${emote.name}:${emote.id}>`
            }else{
                emoteStr = char.emote
            }

            descStr += `\n${guild?.members.cache.get(char.owner)}: ${char.name} ${emoteStr}`
        });

        embedBuilder.setDescription(descStr)

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
    public spTotal : number;
    public spUsed : number;

    constructor(
         name: string,
         emote : string | null,
         prounouns: string | null,
         owner : string,
         public talent : string | null,
         public hope : number,
         public despair : number,
         public brains : number,
         public brawn : number,
         public nimble : number, 
         public social : number, 
         public intuition : number,
         public skills : Array<number> | null) {
            
            super(name, emote, prounouns, owner, brawn + 5, 0, []);

            this.talent = talent;
            this.hope = hope
            this.despair = despair;
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

        db.query(`INSERT INTO ${tableBaseName}_Characters (Name, Emote, Pronouns, Owner, Health, DmgTaken, Talent, Hope, Despair, Brains, Brawn, Nimble, Social, Intuition, SPTotal, SPUsed)
        VALUES ("${this.name}", "${this.emote}", "${this.prounouns}", "${this.owner}", ${this.health}, ${this.dmgTaken}, ${talent}, ${this.hope}, ${this.despair}, ${this.brains}, ${this.brawn}, ${this.nimble}, ${this.social}, ${this.intuition}, ${this.spTotal}, ${this.spUsed});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            this.id = res.insertId
        })

        return true
    }

    static getCharacter(db : mysql.Connection, tableBaseName : string, char_name : string): Promise<DRCharacter | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`, (err, res) =>  {
                if(err || res.length != 1){
                   return resolve(null)
               } 
               
               let retChr = new DRCharacter(res[0].Name, 
                                            res[0].Emote, 
                                            res[0].Pronouns,
                                            res[0].Owner,
                                            res[0].Talent,
                                            res[0].Hope,
                                            res[0].Despair,
                                            res[0].Brains,
                                            res[0].Brawn,
                                            res[0].Nimble,
                                            res[0].Social,
                                            res[0].Intuition,
                                            [])
               retChr.id = res[0].CHR_ID
               
               return resolve(retChr)
           })
        })
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null): EmbedBuilder{

        const owner = guild?.members.cache.get(this.owner)

        return new EmbedBuilder()
        .setColor(owner?.displayHexColor as DiscordJS.ColorResolvable)
        .setTitle(`**${this.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`${this.talent == null ? '' : this.talent + '\n'}${this.prounouns}`)
        .setThumbnail(String(owner?.displayAvatarURL()))
        .addFields(
            { name: '**Owner:**', value: String(owner) },
		    { name: '\u200B', value: '\u200B' },
            { name: 'Health', value: String(this.getCurrentHealth()) , inline: true},
            { name: 'Hope', value: String(this.hope), inline: true},
            { name: 'Despair', value: String(this.despair), inline: true},
            { name: 'Brains', value: String(this.brains), inline: true },
            { name: 'Brawn', value: String(this.brawn), inline: true },
            { name: 'Nimble', value: String(this.nimble), inline: true },
            { name: 'Social', value: String(this.social), inline: true },
            { name: 'Intuition', value: String(this.intuition), inline: true },
            { name: 'SP Used', value: String(this.spUsed), inline: true }
        )
        .setTimestamp()
    }

    async generateRelations(db : mysql.Connection, tableNameBase : string): Promise<boolean>{
        let allChars = await Character.getAllCharacters(db, tableNameBase)
        let queryStr = `INSERT INTO ${tableNameBase}_Relationships (CHR_ID1, CHR_ID2, VALUE)\nVALUES `

        if(allChars == undefined){
            return false
        }

        if(allChars.length < 2){
            return true
        }

        for(let charInd = 0; charInd < allChars.length - 2; ++charInd){
            let char = allChars[charInd]

            if(this.id != char.id){
                queryStr += `(${this.id}, ${char.id}, 0),`
            }
        }

        queryStr += `(${this.id}, ${allChars[allChars.length - 2].id}, 0);`

        db.query(queryStr, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        db.query(`DELETE FROM ${tableBaseName}_Relationships WHERE (CHR_ID1 = ${this.id} OR CHR_ID2 = ${this.id});`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return super.removeFromTable(db, tableBaseName)
    }

    addSkill(skilSignifier : any) : boolean{
        return true;
    }

    addTB(tbSignifier : any) : boolean{
        return true;
    }
}

class DRRelationship {
    public value: number

    constructor(
        public char1 : DRCharacter,
        public char2 : DRCharacter){
        
        this.char1 = char1;
        this.char2 = char2;
        this.value = 0;
    }

    /*findChr() : Character{
        
    }*/

    changeRelationship(db : mysql.Connection, tableNameBase : string, newValue : number): boolean{
        db.query(`UPDATE ${tableNameBase}_Relationships SET Value = ${newValue} WHERE (CHR_ID1 = ${this.char1.id} and CHR_ID2 = ${this.char2.id}) OR (CHR_ID1 = ${this.char2.id} and CHR_ID2 = ${this.char1.id});`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    getRelationship(db : mysql.Connection, tableNameBase : string): Promise<DRRelationship | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableNameBase}_Relationships WHERE (CHR_ID1 = ${this.char1.id} and CHR_ID2 = ${this.char2.id}) OR (CHR_ID1 = ${this.char2.id} and CHR_ID2 = ${this.char1.id});`, (err, res) =>  {
                if(err || res.length != 1){
                    console.log(err)
                   return resolve(null)
               } 
               
               this.value = res[0].Value
               
               return resolve(this)
           })
        })
    }

    static createTable(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Relationships ( 
            CHR_ID1 INT NOT NULL,
            CHR_ID2 INT NOT NULL,
            Value INT NOT NULL,
            PRIMARY KEY (CHR_ID1, CHR_ID2),
            FOREIGN KEY (CHR_ID1) REFERENCES ${tableNameBase}_Characters(CHR_ID),
            FOREIGN KEY (CHR_ID2) REFERENCES ${tableNameBase}_Characters(CHR_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null): EmbedBuilder{

        const owner1 = guild?.members.cache.get(this.char1.owner)
        const owner2 = guild?.members.cache.get(this.char2.owner)
        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.char1.name} X ${this.char2.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setThumbnail(String(guild?.iconURL()))
        .addFields(
            {name: this.char1.name, value: `${this.char1.prounouns}\n${owner1}`, inline: true},
            {name: '💖', value: `**${this.value}**`, inline: true},
            {name: this.char2.name, value: `${this.char2.prounouns}\n${owner2}`, inline: true}
        )
        .setTimestamp()
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

    private inactivizeGames(db : mysql.Connection, dbName : string): void{
        db.query(`UPDATE ${dbName}.ActiveGames SET isActive = 0 WHERE isActive = 1 and SERV_ID = ${this.serverID};`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }

    addToTable(db : mysql.Connection, dbName : string): boolean{

        //Sets currently active game(s) to inactive
        this.inactivizeGames(db, dbName)

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

    setDM(db : mysql.Connection, dbName : string): boolean{

        db.query(`UPDATE ${dbName}.ActiveGames SET DM = '${this.DM}' WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    changeGame(db : mysql.Connection, dbName : string): boolean{

        this.inactivizeGames(db, dbName)

        db.query(`UPDATE ${dbName}.ActiveGames SET isActive = 1 WHERE GameName = '${this.gameName}' and SERV_ID = ${this.serverID};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
            
        })

        return true
    }

    static getCurrentGame(db : mysql.Connection, dbName : string, serverID : string | null, gameName : string | undefined) : Promise<ActiveGame | null>{
        return new Promise((resolve) =>{
            let queryParam

            if(gameName == undefined){
                queryParam = 'isActive = 1'
            }else{
                queryParam = `GameName = '${gameName}'`
            }

            db.query(`SELECT * FROM ${dbName}.ActiveGames WHERE ${queryParam} AND SERV_ID = '${serverID}';`, (err, res) =>  {
                if(err || res.length != 1){
                   return resolve(null)
               } 
               
               return resolve(new ActiveGame(res[0].SERV_ID, res[0].GameName, res[0].GameType, res[0].DM, res[0].isActive))
           })
        })
    }

}

export { Character, DRCharacter, DRRelationship, DRSkill, DRTruthBullet, ActiveGame}