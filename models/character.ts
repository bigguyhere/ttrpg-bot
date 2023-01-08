import mysql from 'mysql'
import DiscordJS, { EmbedBuilder } from 'discord.js';
import { Inventory } from './inventory'
import { ActiveGame } from './activegame';
import { UtilityFunctions } from '../utility';

export class Character {
    public id: number;
    public prounouns: string;
    public health: number;
    constructor(public name: string, 
                public emote: string | null, 
                prounouns: string | null, 
                public owner: string, 
                health: number | null, 
                public dmgTaken : number, 
                public status : string | null,
                public otherStats : Array<[string, string]>) {
        this.id = -1;
        this.name = name;
        this.emote = emote;
        this.owner = owner;
        this.dmgTaken = dmgTaken;
        this.status = status;
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
            Name varchar(255) NOT NULL UNIQUE,
            Emote varchar(255),
            Pronouns varchar(255) NOT NULL,
            Owner varchar(255),
            Health SMALLINT,
            DmgTaken SMALLINT,
            Status varchar(255),`

            additionalStats.forEach(stat =>{
                queryStr += `${stat[0]} ${stat[1]},\n`
            })

            queryStr += '\nPRIMARY KEY (CHR_ID));'
        
        db.query(queryStr, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    addToTable(db : mysql.Connection, tableBaseName : string): Promise<boolean>{
        return new Promise((resolve) =>{
            let queryStr = `INSERT INTO ${tableBaseName}_Characters (Name, Emote, Pronouns, Owner, Health, DmgTaken, Status`
            let valuesStr = `VALUES ("${this.name}", "${this.emote}", "${this.prounouns}", "${this.owner}", ${this.health}, ${this.dmgTaken}, "${this.status}"`

            this.otherStats.forEach(stat =>{
                queryStr += `, ${stat[0]}`
                valuesStr += `, "${stat[1]}"`
            })

            queryStr += ')'
            valuesStr += ');'
            
            db.query(`${queryStr}\n${valuesStr}`, (err, res) =>  {
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

    updateDMG(db : mysql.Connection, tableBaseName : string, value : number): boolean{
        db.query(`UPDATE ${tableBaseName}_Characters SET DmgTaken = DmgTaken+${value} WHERE Name = '${this.name}';`, (err, res) => {
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

    removeFromTable(db : mysql.Connection, tableBaseName : string): boolean{

        db.query(`DELETE FROM ${tableBaseName}_Characters WHERE Name='${this.name}'`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

        return true
    }

    static getCharacter(db : mysql.Connection, tableBaseName : string, char_name : string | number): Promise<Character | null>{
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
                let baseStats = ['CHR_ID', 'Name', 'Emote', 'Pronouns', 'Owner', 'Health', 'DmgTaken', 'Status']

                ress.forEach((stat: { Field: string; Type: string; }) => {
                    if(!baseStats.includes(stat.Field)){
                        stats.push([stat.Field, String(eval(`res[0].${stat.Field}`))])
                    }
                });

                let retChr = new Character(res[0].Name, res[0].Emote, res[0].Pronouns, res[0].Owner, res[0].Health, res[0].DmgTaken, res[0].Status, stats)
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

                res.forEach((char: { CHR_ID: number; Name: string; Emote: string | null; Pronouns: string | null; Owner: string; Health: number | null; DmgTaken: number; Status: string | null}) =>{
                let retChr = new Character(char.Name, char.Emote, char.Pronouns, char.Owner, char.Health, char.DmgTaken, char.Status, [])
                retChr.id = char.CHR_ID

                retArr.push(retChr)
                })

                return resolve(retArr)
            })
        })
    }

    getAllChrItems(db : mysql.Connection, tableBaseName : string): Promise<Array<Inventory> | null>{
        return new Promise((resolve) =>{

            db.query(`SELECT * FROM ${tableBaseName}_Inventories as Inventories WHERE Inventories.CHR_ID = ${this.id};`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<Inventory>

                res.forEach((item: { CHR_ID: number; ItemName: string; Quantity: number | null; Description: string | null; Weight: number | null; }) =>{
                let retItem = new Inventory(item.CHR_ID, item.ItemName, item.Quantity, item.Description, item.Weight)

                retArr.push(retItem)
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
            { name: '**Status**', value: String(this.status) , inline: true},
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
            let emoteStr = UtilityFunctions.getEmoteDisplay(guild, char.emote)
            descStr += `\n${guild?.members.cache.get(char.owner)}: ${char.name} ${emoteStr}`
        });

        embedBuilder.setDescription(descStr)

        return embedBuilder
    }

    buildInventoryEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, items : Array<Inventory> | null): EmbedBuilder | null{
        
        if(items == null){
            return null
        }

        let thumbnail = guild?.emojis.cache.get(String(this.emote))?.url
        const owner = guild?.members.cache.get(this.owner)

        if(thumbnail == undefined){
            thumbnail = String(owner?.displayAvatarURL())
        }

        let embedBuilder = new EmbedBuilder()
        .setColor(owner?.displayHexColor as DiscordJS.ColorResolvable)
        .setTitle(`**${this.name}'s Inventory**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setThumbnail(thumbnail)
        .setTimestamp()

        let totalWeight = 0;
        let descStr = `**Item Name:** Amnt *(Weight)*\n`
        items.forEach(item => {
            let itemWeight = (item.weight == null ? 0 : item.quantity * item.weight)
            descStr += `\n**${item.itemName}:** x${item.quantity} ${(itemWeight == 0 ? '' : `*(${itemWeight})*`)}`
            totalWeight += itemWeight
        });

        if(totalWeight != 0){
            descStr += `\n\n**Total Weight:** ${totalWeight}`
        }

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