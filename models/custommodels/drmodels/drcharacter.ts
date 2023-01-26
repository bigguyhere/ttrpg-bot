import DiscordJS, { EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { Character } from '../../character';
import { DRSkill } from './drskill';
import { DRTruthBullet } from './drtruthbullet';

export class DRCharacter extends Character {
    public spTotal : number;
    public spUsed : number;

    constructor(
            name: string,
            emote : string | null = null,
            prounouns: string | null = null,
            owner : string = '',
            public talent : string | null = null,
            public hope : number = -1,
            public despair : number = -1,
            public brains : number = -1,
            public brawn : number = -1,
            public nimble : number = -1, 
            public social : number = -1, 
            public intuition : number = -1) {
            
            super(name, emote, prounouns, owner, brawn + 5, 0, 'Alive', []);

            this.talent = talent;
            this.hope = hope
            this.despair = despair;
            this.brains = brains;
            this.brawn = brawn;
            this.nimble = nimble;
            this.social = social;
            this.intuition = intuition;
            this.spTotal = 15;
            this.spUsed = 0;
    }

    static createTable(db : mysql.Connection, tableNameBase : string) {
        db.query(`ALTER TABLE ${tableNameBase}_Characters 
            ADD Talent varchar(255),
            ADD Hope TINYINT NOT NULL,
            ADD Despair TINYINT NOT NULL,
            ADD Brains TINYINT NOT NULL,
            ADD Brawn TINYINT NOT NULL,
            ADD Nimble TINYINT NOT NULL,
            ADD Social TINYINT NOT NULL,
            ADD Intuition TINYINT NOT NULL,
            ADD SPTotal TINYINT NOT NULL,
            ADD SPUsed TINYINT NOT NULL`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })
    }

    /*
        TODO: Rewrite this method to just call it's parent's addToTable method with the additional 
      dr columns as additional cols (Will allow for less commands)
    */
    addToTable(db : mysql.Connection, tableBaseName : string): Promise<boolean>{
        return new Promise((resolve) =>{
            let talent
            if(this.talent != null){
                talent = `"${this.talent}"` 
            }else{
                talent = "null"
            }

            db.query(`INSERT INTO ${tableBaseName}_Characters (Name, Emote, Pronouns, Owner, Health, 
                DmgTaken, Status, Talent, Hope, Despair, Brains, Brawn, Nimble, Social, Intuition, SPTotal, SPUsed)
                VALUES ("${this.name}", "${this.emote}", "${this.prounouns}", "${this.owner}", ${this.health},
                    ${this.dmgTaken}, "${this.status}", ${talent}, ${this.hope}, ${this.despair}, ${this.brains}, ${this.brawn}, 
                    ${this.nimble}, ${this.social}, ${this.intuition}, ${this.spTotal}, ${this.spUsed});`, (err, res) =>  {
                if(err){
                    if(err.errno == 1062){ // Duplicate Character
                        return resolve(false)
                    }
                    console.log(err)
                    throw err
                }
                
                this.id = res.insertId

                return resolve(true)
            })
        })
    }

    static getCharacter(db : mysql.Connection, tableBaseName : string, char_name: string): Promise<DRCharacter | null>{
        
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Characters WHERE Name = "${char_name}";`, (err, res) =>  {
                if(err || res.length != 1){
                    console.log(err)
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
                                            res[0].Intuition
                                            )
                retChr.id = res[0].CHR_ID
                retChr.status = res[0].Status
                retChr.health = res[0].Health
                retChr.dmgTaken = res[0].DmgTaken
                
                return resolve(retChr)
            })
        })
    }

    static getAllCharacters(db : mysql.Connection, tableBaseName : string, onlyAlive : boolean = false): Promise<Array<DRCharacter> | null>{
        return new Promise((resolve) =>{
            let condStr = onlyAlive ? ' WHERE Status != \'Victim\' AND Status != \'Dead\';' : ''
            db.query(`SELECT * FROM ${tableBaseName}_Characters${condStr};`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<DRCharacter>

                res.forEach((char: { Name: string; Emote: string | null; Pronouns: string | null; 
                    Owner: string; Talent: string | null; Hope: number; Despair: number; Brains: number; 
                    Brawn: number; Nimble: number; Social: number; Intuition: number; CHR_ID: number; }) =>{
                let retChr = new DRCharacter(char.Name, 
                                            char.Emote, 
                                            char.Pronouns,
                                            char.Owner,
                                            char.Talent,
                                            char.Hope,
                                            char.Despair,
                                            char.Brains,
                                            char.Brawn,
                                            char.Nimble,
                                            char.Social,
                                            char.Intuition)
                retChr.id = char.CHR_ID
                retChr.status = res[0].Status
                retChr.health = res[0].Health
                retChr.dmgTaken = res[0].DmgTaken

                retArr.push(retChr)
                })

                return resolve(retArr)
            })
        })
    }

    static setToDead(db : mysql.Connection, tableBaseName : string, blackenedWon: boolean){
        const queryStr = blackenedWon 
        ? `UPDATE ${tableBaseName}_Characters SET Status = 'Dead' WHERE Status != 'Blackened';
           UPDATE ${tableBaseName}_Characters SET Status = 'Survivor' WHERE Status = 'Blackened';`
        : `UPDATE ${tableBaseName}_Characters SET Status = 'Dead' WHERE Status != 'Alive';`
        db.query(queryStr, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        }) 
    }

    updateHD(db : mysql.Connection, tableBaseName : string, hope : number, despair : number){
        db.query(`UPDATE ${tableBaseName}_Characters SET Hope = Hope+${hope}, Despair = Despair+${despair}
                 WHERE Name = '${this.name}' AND (Status = 'Alive' OR Status = 'Blackened');`, (err, res) => {
            if(err){
                console.log(err)
                throw err
            }
        })  
    }

    buildViewEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null): EmbedBuilder{

        let thumbnail = guild?.emojis.cache.get(String(this.emote))?.url
        const owner = guild?.members.cache.get(this.owner)
        let color = owner?.displayHexColor as DiscordJS.ColorResolvable | undefined

        if(thumbnail == undefined){
            thumbnail = String(owner?.displayAvatarURL())
        }

        if(color == undefined){
            color = Character.defaultEmbedColor
        }

        return new EmbedBuilder()
        .setColor(color)
        .setTitle(`**${this.name}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(`${this.talent == null ? '' : this.talent + '\n'}${this.prounouns}`)
        .setThumbnail(thumbnail)
        .addFields(
            { name: '**Owner:**', value: String(owner) },
            { name: '\u200B', value: '\u200B' },
            { name: 'Health', value: String(this.getCurrentHealth()) , inline: true},
            { name: 'Brains', value: String(this.brains), inline: true },
            { name: 'Brawn', value: String(this.brawn), inline: true },
            { name: 'Nimble', value: String(this.nimble), inline: true },
            { name: 'Social', value: String(this.social), inline: true },
            { name: 'Intuition', value: String(this.intuition), inline: true },
            { name: 'SP Used', value: String(this.spUsed), inline: true },
            { name: 'SP Total', value: String(this.spTotal), inline: true }
        )
        .setTimestamp()
    }

    buildSkillEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, skills : Array<DRSkill> | null, 
        paginationLimit : number = 10): EmbedBuilder[] | null{
        
        if(skills == null){
            return null
        }
        let embeds : EmbedBuilder[] = []

        let thumbnail = guild?.emojis.cache.get(String(this.emote))?.url
        const owner = guild?.members.cache.get(this.owner)
        let color = owner?.displayHexColor as DiscordJS.ColorResolvable | undefined

        if(thumbnail == undefined){
            thumbnail = String(owner?.displayAvatarURL())
        }

        if(color == undefined){
            color = Character.defaultEmbedColor
        }

        let spUsed = 0

        skills.forEach(skill => {
            spUsed += skill.spCost
        })

        const totalStr = `\n\n**SP Total:** ${this.spTotal}\n**SP Used:** ${spUsed} ${spUsed > this.spTotal ? 
            '\n**THIS CHARACTER HAS EXCEEDED THEIR SP TOTAL**': ''}` //TODO: Pronoun per character

        const numEmbeds = skills.length > 0 ? Math.ceil(skills.length / paginationLimit) : 1
        
        for(let i = 0; i < numEmbeds; ++i){
            embeds.push(new EmbedBuilder()
            .setColor(color)
            .setTitle(`**${this.name}'s Skills**`)
            .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
            .setThumbnail(thumbnail)
            .setTimestamp())

            let descStr = `**Skills:**\n***(Cost) - Name:*** *Prereqs*\n`

            const curLimit = paginationLimit * (i + 1)
            const limit = curLimit > skills.length ? skills.length : curLimit
            for(let j = paginationLimit * i; j < limit; ++j){
                descStr += `\n**(${skills[j].spCost}) - ${skills[j].name}:** ${skills[j].prereqs}`
            }

            descStr += totalStr

            embeds[i].setDescription(descStr)
        }

        return embeds
    }

    buildTBEmbed(user : DiscordJS.User, guild : DiscordJS.Guild | null, tbs : Array<DRTruthBullet> | null,
        paginationLimit : number = 10): EmbedBuilder[] | null{
        
        if(tbs == null){
            return null
        }
        let embeds : EmbedBuilder[] = []

        let thumbnail = guild?.emojis.cache.get(String(this.emote))?.url
        const owner = guild?.members.cache.get(this.owner)
        let color = owner?.displayHexColor as DiscordJS.ColorResolvable | undefined

        if(thumbnail == undefined){
            thumbnail = String(owner?.displayAvatarURL())
        }

        if(color == undefined){
            color = Character.defaultEmbedColor
        }

        const numEmbeds = tbs.length > 0 ? Math.ceil(tbs.length / paginationLimit) : 1

        for(let i = 0; i < numEmbeds; ++i){
            embeds.push(new EmbedBuilder()
            .setColor(color)
            .setTitle(`**${this.name}'s Truth Bullets**`)
            .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
            .setThumbnail(thumbnail)
            .setTimestamp())

            let descStr = `**Truth Bullets:**\n`

            const curLimit = paginationLimit * (i + 1)
            const limit = curLimit > tbs.length ? tbs.length : curLimit
            for(let j = paginationLimit * i; j < limit; ++j){
                descStr += `\n**Trial ${tbs[j].trial == -1 ? '?' : tbs[j].trial}:** *${tbs[j].name}*`
            }

            descStr += `\n\n**Total Truth Bullets:** ${tbs.length}`

            embeds[i].setDescription(descStr)
        }

        return embeds
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

    getAllChrSkills(db : mysql.Connection, tableBaseName : string): Promise<Array<DRSkill> | null>{
        return new Promise((resolve) =>{
            db.query(`SELECT * FROM ${tableBaseName}_Skills as Skills JOIN ${tableBaseName}_ChrSkills as ChrSkills 
                            WHERE ChrSkills.CHR_ID = ${this.id} AND ChrSkills.SKL_ID = Skills.SKL_ID ORDER BY Name;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    return resolve(null)
                } 

                let retArr = new Array<DRSkill>

                res.forEach((skill: { Name: string; Prereqs: string | null | undefined; Description: string | undefined;
                     SPCost: number | undefined; Type: string | null | undefined; SKL_ID: number; }) =>{
                let retSkill = new DRSkill(skill.Name, skill.Prereqs, skill.Description, skill.SPCost, skill.Type)
                retSkill.id = skill.SKL_ID

                retArr.push(retSkill)
                })

                return resolve(retArr)
            })
        })
    }

    getAllChrTBs(db : mysql.Connection, tableBaseName : string, trial : number | null): Promise<Array<DRTruthBullet> | null>{
        return new Promise((resolve) =>{
            let trialStr = ''
            if(trial != null){
                trialStr = `AND TBs.Trial = "${trial}"`
            }
            db.query(`SELECT * FROM ${tableBaseName}_TruthBullets as TBs JOIN ${tableBaseName}_ChrTBs as ChrTBs 
                            WHERE ChrTBs.CHR_ID = ${this.id} AND ChrTBs.TB_ID = TBs.TB_ID ${trialStr};`, (err, res) =>  {
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

    removeFromTable(db : mysql.Connection, tableBaseName : string){
        db.query(`DELETE FROM ${tableBaseName}_Relationships WHERE (CHR_ID1 = ${this.id} OR CHR_ID2 = ${this.id});`, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })

        super.removeFromTable(db, tableBaseName)
    }
}