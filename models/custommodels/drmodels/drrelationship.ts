import DiscordJS, { EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { DRCharacter } from './drcharacter';

export class DRRelationship {
    public value: number

    constructor(
        public char1 : DRCharacter,
        public char2 : DRCharacter){
        
        this.char1 = char1;
        this.char2 = char2;
        this.value = 0;
    }

    changeRelationship(db : mysql.Connection, tableNameBase : string, newValue : number): boolean{
        db.query(`UPDATE ${tableNameBase}_Relationships SET Value = ${newValue} 
            WHERE (CHR_ID1 = ${this.char1.id} and CHR_ID2 = ${this.char2.id}) 
            OR (CHR_ID1 = ${this.char2.id} and CHR_ID2 = ${this.char1.id});`
            , (err, res) =>{
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

    static getHDChange(db : mysql.Connection, tableNameBase : string, status : string): Promise<Array<[string, number]> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT Char1.Name, 
            SUM(CASE 
                WHEN Value > 0 THEN -2
                WHEN Value = -2 THEN 1
                ELSE 0
                END) AS 'Change'
            FROM 
            ${tableNameBase}_Characters as Char1
            JOIN ${tableNameBase}_Relationships as Relationships
            JOIN ${tableNameBase}_Characters as Char2
            ON Relationships.CHR_ID1 = Char1.CHR_ID AND
            Relationships.CHR_ID2 = Char2.CHR_ID
            WHERE Char2.Status = '${status}' AND Char1.Status = 'Alive'
            GROUP BY Char1.Name;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr : Array<[string, number]> = []

                res.forEach((result: { Name: string; Change: number; }) => {
                    retArr.push([result.Name, result.Change])
                })
                
                return resolve(retArr)
            })
        })
    }

    static createTable(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Relationships ( 
            CHR_ID1 INT NOT NULL,
            CHR_ID2 INT NOT NULL,
            Value INT NOT NULL,
            PRIMARY KEY (CHR_ID1, CHR_ID2),
            FOREIGN KEY (CHR_ID1) REFERENCES ${tableNameBase}_Characters(CHR_ID) ON DELETE CASCADE,
            FOREIGN KEY (CHR_ID2) REFERENCES ${tableNameBase}_Characters(CHR_ID) ON DELETE CASCADE);`, (err, res) => {
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