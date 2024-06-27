import DiscordJS, { Client, EmbedBuilder } from "discord.js";
import { Character } from "../../../models/character";
import mysql, { Connection, Pool, RowDataPacket } from "mysql2";
import { IPKMCharacterObj } from "./pkm_objectDefs";

export class PokeCharacter extends Character {
    public wounds: number = 0;

    constructor(
        name: string,
        emote: string | null = null,
        prounouns: string | null = null,
        owner: string = "",
        public heart: number = -1,
        public fitness: number = -1,
        public research: number = -1,
        public tactics: number = -1,
        public advancement: number | null = null,
        public exp: number | null = null,
        public money: number | null = null,
        public firstImpression?: string | null,
        public calling?: string | null
    ) {
        super(name, emote, prounouns, owner, fitness / 2, 0);
        // Make data type for storing edges and hinderances

        this.heart = heart;
        this.fitness = fitness;
        this.research = research;
        this.tactics = tactics;
        this.advancement = advancement === null ? 0 : advancement;
        this.exp = exp === null ? 0 : exp;
        this.money = money === null ? 0 : money;
        this.firstImpression = firstImpression;
        this.calling = calling;
    }

    static createTable(db: Connection | Pool, tableNameBase: string) {
        const pkmCols: string[] = [
            "Heart TINYINT NOT NULL",
            "Fitness TINYINT NOT NULL",
            "Research TINYINT NOT NULL",
            "Tactics TINYINT NOT NULL",
            "Advancement TINYINT UNSIGNED NOT NULL",
            "Exp SMALLINT UNSIGNED NOT NULL",
            "Money SMALLINT NOT NULL",
            "FirstImp varchar(255)",
            "Calling varchar(255)",
        ];

        super.createTable(db, tableNameBase, pkmCols);
    }

    addToTable(db: Connection | Pool, tableBaseName: string): Promise<boolean> {
        const queryStr =
            "Heart, Fitness, Research, Tactics, Advancement, Exp, Money, FirstImp, Calling";
        const valueStr = `${this.heart}, ${this.fitness}, ${this.research}, ${
            this.tactics
        }, ${this.advancement}, ${this.exp}, ${this.money}, 
            ${
                this.firstImpression == null
                    ? "null"
                    : `"${this.firstImpression}"`
            }, ${this.calling == null ? "null" : `"${this.calling}"`}`;

        return super.addToTable(db, tableBaseName, queryStr, valueStr);
    }

    static getCharacter(
        db: Connection | Pool,
        tableBaseName: string,
        char_name: string
    ): Promise<PokeCharacter | null> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`,
                (err, res) => {
                    if (err || res.length != 1) {
                        console.log(err);
                        return resolve(null);
                    }

                    let retChr = new PokeCharacter(
                        res[0].Name,
                        res[0].Emote,
                        res[0].Pronouns,
                        res[0].Owner,
                        res[0].Heart,
                        res[0].Fitness,
                        res[0].Research,
                        res[0].Tactics,
                        res[0].Advancement,
                        res[0].Exp,
                        res[0].Money,
                        res[0].FirstImp,
                        res[0].Calling
                    );
                    retChr.id = res[0].CHR_ID;
                    retChr.status = res[0].Status;
                    retChr.health = res[0].Health;
                    retChr.dmgTaken = res[0].DmgTaken;

                    return resolve(retChr);
                }
            );
        });
    }

    static getAllCharacters(
        db: Connection | Pool,
        tableBaseName: string,
        onlyAlive: boolean = false
    ): Promise<Array<PokeCharacter> | null> {
        return new Promise((resolve) => {
            let condStr = onlyAlive
                ? " WHERE Status != 'Victim' AND Status != 'Dead'"
                : "";
            db.execute<IPKMCharacterObj[]>(
                `SELECT * FROM ${tableBaseName}_Characters${condStr} ORDER BY Name;`,
                (err, res) => {
                    if (err) {
                        console.log(err);
                        return resolve(null);
                    }

                    let retArr = new Array<PokeCharacter>();

                    res.forEach((char) => {
                        let retChr = new PokeCharacter(
                            char.Name,
                            char.Emote,
                            char.Pronouns,
                            char.Owner,
                            char.Heart,
                            char.Fitness,
                            char.Research,
                            char.Tactics,
                            char.Advancement,
                            char.Exp,
                            char.Money,
                            char.FirstImp,
                            char.Calling
                        );
                        retChr.id = char.CHR_ID;
                        retChr.status = res[0].Status;
                        retChr.health = res[0].Health;
                        retChr.dmgTaken = res[0].DmgTaken;

                        retArr.push(retChr);
                    });

                    return resolve(retArr);
                }
            );
        });
    }

    async buildViewEmbed(
        user: DiscordJS.User,
        client: Client<boolean>
    ): Promise<EmbedBuilder> {
        let thumbnail = client.emojis.resolve(String(this.emote))?.imageURL();
        const owner = await client.users.fetch(this.owner);
        let color = owner.hexAccentColor as
            | DiscordJS.ColorResolvable
            | undefined;

        if (thumbnail == undefined) {
            thumbnail = String(owner?.displayAvatarURL());
        }

        if (color == undefined) {
            color = Character.defaultEmbedColor;
        }

        return new EmbedBuilder()
            .setColor(color)
            .setTitle(`**${this.name}**`)
            .setAuthor({
                name: `${user.username}`,
                iconURL: String(user.displayAvatarURL()),
            })
            .setDescription(
                `${
                    this.calling == null
                        ? ""
                        : `__**Calling:**__ ${this.calling}\n`
                }${
                    this.firstImpression == null
                        ? ""
                        : `__**First Impression:**__ ${this.firstImpression}\n`
                }${this.prounouns}`
            )
            .setThumbnail(thumbnail)
            .addFields(
                { name: "**Owner:**", value: String(owner) },
                { name: "\u200B", value: "\u200B" },
                {
                    name: "Wounds",
                    value: String(this.getCurrentHealth()),
                    inline: true,
                },
                { name: "Heart", value: String(this.heart), inline: true },
                { name: "Fitness", value: String(this.fitness), inline: true },
                {
                    name: "Research",
                    value: String(this.research),
                    inline: true,
                },
                { name: "Tactics", value: String(this.tactics), inline: true },
                {
                    name: "Current Adv.",
                    value: String(this.advancement),
                    inline: true,
                },
                { name: "Current EXP", value: String(this.exp), inline: true },
                { name: "Money", value: String(this.money), inline: true }
            )
            .setTimestamp();
    }
}
