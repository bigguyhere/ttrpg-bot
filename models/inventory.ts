import mysql, { Connection, Pool, RowDataPacket } from "mysql2";
import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import { ActiveGame } from "./activegame";
import { LogLevel, LoggingFunctions, SeverityLevel } from "../utility/logging";

export class Inventory {
    public quantity: number;
    constructor(
        public chrId: number,
        public itemName: string,
        quantity: number | null,
        public desc: string | null,
        public weight: number | null
    ) {
        this.chrId = chrId;
        this.itemName = itemName;
        this.desc = desc;
        this.weight = weight;

        if (quantity == null) {
            this.quantity = 1;
        } else {
            this.quantity = quantity;
        }
    }

    static createTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableBaseName}_Inventories (
            CHR_ID INT NOT NULL,
            ItemName varchar(255) NOT NULL,
            Quantity INT NOT NULL,
            Description varchar(1000),
            Weight INT,
            PRIMARY KEY (CHR_ID, ItemName),
            FOREIGN KEY (CHR_ID) REFERENCES ${tableBaseName}_Characters(CHR_ID) ON DELETE CASCADE);`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to create table \"${tableBaseName}_Inventories\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }

    addToTable(db: Connection | Pool, tableBaseName: string) {
        let desc = this.desc == null ? "null" : `"${this.desc}"`;
        let weight = this.weight == null ? "null" : `"${this.weight}"`;

        db.execute(
            `INSERT INTO ${tableBaseName}_Inventories (CHR_ID, ItemName, Quantity, Description, Weight)
        VALUES ("${this.chrId}", "${this.itemName}", "${this.quantity}", ${desc}, ${weight});`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to add \"${this.itemName}\" to table \"${tableBaseName}_Inventories\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }

    static getItem(
        db: Connection | Pool,
        tableBaseName: string,
        char_id: number,
        item_name: string
    ): Promise<Inventory | boolean | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Inventories WHERE CHR_ID = '${char_id}' AND ItemName = '${item_name}';`,
                (err, res) => {
                    if (err) {
                        LoggingFunctions.log(
                            `Unable to get \"${item_name}\" from table \"${tableBaseName}_Inventories\"\n${err.stack}`,
                            LogLevel.ERROR,
                            SeverityLevel.HIGH
                        );
                        return resolve(null);
                    }

                    if (res.length != 1) {
                        LoggingFunctions.log(
                            `${res.length} items obtained under name \"${item_name}\" from table \"${tableBaseName}_Inventories\"`,
                            LogLevel.ERROR,
                            SeverityLevel.MEDIUM
                        );
                        return resolve(false);
                    }

                    let retInv = new Inventory(
                        res[0].CHR_ID,
                        res[0].ItemName,
                        res[0].Quantity,
                        res[0].Description,
                        res[0].Weight
                    );

                    return resolve(retInv);
                }
            );
        });
    }

    async buildViewEmbed(
        user: DiscordJS.User,
        guild: DiscordJS.Guild | null,
        client: Client<boolean>,
        activeGame: ActiveGame
    ): Promise<EmbedBuilder> {
        return new EmbedBuilder()
            .setColor(0x7852a9)
            .setTitle(
                `**${this.itemName} (Character ID: ${this.chrId}) Summary**`
            )
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(
                `**DM:** ${await client.users.fetch(activeGame.DM)}
                        ${
                            this.weight == null
                                ? ""
                                : `\n**Weight:** ${this.weight}`
                        }
                        **Quantity:** ${this.quantity}
                        ${
                            this.desc == null
                                ? ""
                                : `**Description:** ${this.desc}`
                        }`
            )
            .setThumbnail(String(guild?.iconURL()))
            .setTimestamp();
    }

    removeFromTable(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `DELETE FROM ${tableBaseName}_Inventories WHERE CHR_ID = '${this.chrId}' AND ItemName = '${this.itemName}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to remove item \"${this.itemName}\" from \"${tableBaseName}_Inventories\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.LOW
                    );
                    throw err;
                }
            }
        );
    }

    updateItem(
        db: Connection | Pool,
        tableBaseName: string,
        newQuantity: number,
        newWeight: number | null,
        newDesc: string | null
    ) {
        db.execute(
            `UPDATE ${tableBaseName}_Inventories SET Quantity = '${newQuantity}' ${
                newWeight == null ? `, Weight = ${newWeight}` : ""
            } ${newDesc == null ? `, Description = ${newDesc}` : ""}
            WHERE CHR_ID = '${this.chrId}' AND ItemName = '${this.itemName}';`,
            (err, res) => {
                if (err) {
                    LoggingFunctions.log(
                        `Unable to update item \"${this.itemName}\" from \"${tableBaseName}_Inventories\"\n${err.stack}`,
                        LogLevel.ERROR,
                        SeverityLevel.HIGH
                    );
                    throw err;
                }
            }
        );
    }
}
