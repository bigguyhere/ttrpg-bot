import mysql from 'mysql'
import DiscordJS, { EmbedBuilder } from 'discord.js';
import { ActiveGame } from './activegame';

export class Inventory{

    public quantity : number;
    constructor(public chrId : number, public itemName : string, quantity : number | null, public desc : string | null, public weight : number | null){
        this.chrId = chrId;
        this.itemName = itemName;
        this.desc = desc
        this.weight = weight

        if(quantity == null){
            this.quantity = 1;
        }else{
            this.quantity = quantity;
        }
    }

    static createTable(db : mysql.Connection, tableNameBase : string){
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Inventories (
            CHR_ID INT NOT NULL,
            ItemName varchar(255) NOT NULL,
            Quantity INT NOT NULL,
            Description varchar(1000),
            Weight INT,
            PRIMARY KEY (CHR_ID, ItemName),
            FOREIGN KEY (CHR_ID) REFERENCES ${tableNameBase}_Characters(CHR_ID) ON DELETE CASCADE);`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })
    }

    

    addToTable(db : mysql.Connection, tableBaseName : string){
        let desc = this.desc == null ? "null" : `"${this.desc}"`
        let weight = this.weight == null ? "null" : `"${this.weight}"`

        db.query(`INSERT INTO ${tableBaseName}_Inventories (CHR_ID, ItemName, Quantity, Description, Weight)
        VALUES ("${this.chrId}", "${this.itemName}", "${this.quantity}", ${desc}, ${weight});`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })
    }

    static getItem(db : mysql.Connection, tableBaseName : string, char_id : number, item_name : string): Promise<Inventory | boolean | null>{      
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Inventories WHERE CHR_ID = '${char_id}' AND ItemName = '${item_name}';`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                if(res.length != 1){
                    return resolve(false)
                }
                
                let retInv = new Inventory(res[0].CHR_ID, 
                                            res[0].ItemName, 
                                            res[0].Quantity,
                                            res[0].Description,
                                            res[0].Weight)
                
                return resolve(retInv)
            })
        })
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, activeGame : ActiveGame): EmbedBuilder{
        
        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.itemName} (Character ID: ${this.chrId}) Summary**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`**DM:** ${guild?.members.cache.get(activeGame.DM)}
                        ${ this.weight == null ? '' : `\n**Weight:** ${this.weight}`}
                        **Quantity:** ${this.quantity}
                        ${ this.desc == null ? '' : `**Description:** ${this.desc}`}`)
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()
    }

    removeFromTable(db : mysql.Connection, tableBaseName : string){
        db.query(`DELETE FROM ${tableBaseName}_Inventories WHERE CHR_ID = '${this.chrId}' AND ItemName = '${this.itemName}';`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })
    }

    updateItem(db : mysql.Connection, tableBaseName : string, newQuantity : number, newWeight : number | null, newDesc : string | null){
        db.query(`UPDATE ${tableBaseName}_Inventories SET Quantity = '${newQuantity}' ${newWeight == null ? `, Weight = ${newWeight}`: ''} ${newDesc == null ? `, Description = ${newDesc}`: ''}
            WHERE CHR_ID = '${this.chrId}' AND ItemName = '${this.itemName}';`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }
}