import DiscordJS, { EmbedBuilder } from 'discord.js';
import mysql from 'mysql'
import { UtilityFunctions } from '../../../utility';
import { DRCharacter } from './drcharacter';

export class DRVote {

    constructor(
        public voter : DRCharacter,
        public vote : DRCharacter){
        
        this.voter = voter;
        this.vote = vote;
    }

    public static createTable(db : mysql.Connection, tableNameBase : string): boolean {
        db.query(`CREATE TABLE IF NOT EXISTS ${tableNameBase}_Votes ( 
            Voter INT NOT NULL,
            Vote INT,
            PRIMARY KEY (Voter),
            FOREIGN KEY (Voter) REFERENCES ${tableNameBase}_Characters(CHR_ID),
            FOREIGN KEY (Vote) REFERENCES ${tableNameBase}_Characters(CHR_ID));`, (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }
            })

        return true
    }

    static generateVotes(db : mysql.Connection, tableNameBase : string, allChars : Array<DRCharacter>) {
        let queryStr = `INSERT INTO ${tableNameBase}_Votes (Voter, Vote)\nVALUES `

        if(allChars.length == 0){
            return
        }

        for(let charInd = 0; charInd < allChars.length - 1; ++charInd){
            queryStr += `(${allChars[charInd].id}, null),`
        }

        queryStr += `(${allChars[allChars.length - 1].id}, null);`

        db.query(queryStr, (err, res) =>{
            if(err){
                console.log(err)
                throw err
            }
        })
    }

    public static  async dropTable(db : mysql.Connection, tableNameBase : string){

        db.query(`DROP TABLE IF EXISTS ${tableNameBase}_Votes;`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })

    }

    updateVote(db : mysql.Connection, tableBaseName : string) {

        db.query(`UPDATE ${tableBaseName}_Votes SET Vote = ${this.vote.id}
        WHERE Voter = ${this.voter.id};`, (err, res) =>  {
            if(err){
                console.log(err)
                throw err
            }
        })
    }

    static getResults(db: mysql.Connection, tableNameBase : string) : Promise<Array<[DRCharacter, number]>>{
        return new Promise((resolve) => {
            db.query(`SELECT ChrTbl.Name as Candidate, ChrTbl.Emote, COUNT(VoteTbl.Voter) as Votes, ChrTbl.Status, ChrTbl.Talent
            FROM ${tableNameBase}_Votes as VoteTbl LEFT JOIN ${tableNameBase}_Characters as ChrTbl 
            ON VoteTbl.Vote=ChrTbl.CHR_ID GROUP BY VoteTbl.Vote ORDER BY Votes DESC;`, 
                (err, res) => {
                if(err){
                    console.log(err)
                    throw err
                }

                let retArr : Array<[DRCharacter, number]> = []

                res.forEach(async (result: { Candidate: string | null; Emote: string | null; 
                                                Talent: string | null; Status: string | null; Votes: number; }) => {
                    if(result.Candidate != null){
                        let chr = new DRCharacter(result.Candidate, result.Emote, null, '', result.Talent,
                                                    -1, -1, 0, 0, 0, 0, 0)
                        chr.status = result.Status
                        retArr.push([chr,result.Votes])
                    }
                })

                return resolve(retArr)
            })
        })
    }

    static countRemainingVotes(db : mysql.Connection, tableBaseName : string) : Promise<number>{

        return new Promise((resolve) =>{
            db.query(`SELECT COUNT(*) as Count FROM ${tableBaseName}_Votes WHERE Vote is null;`, (err, res) =>  {
                if(err){
                    console.log(err)
                    throw err
                }

                return resolve(res[0].Count)
            })
        })
    }

    static buildSummaryEmbed(guild : DiscordJS.Guild | null, results : Array<[DRCharacter, number]>): EmbedBuilder | undefined{
        
        let embedBuilder = new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**Voting Summary**`)
        .setThumbnail(String(guild?.iconURL()))
        .setTimestamp()

        let descStr = `**Votes:**\n`
        results.forEach(result => {
            if(result[0] == null){
                return undefined
            }

            let emoteStr = UtilityFunctions.getEmoteDisplay(guild, result[0].emote)
            descStr += `\n${emoteStr} ${result[0].name}: **${result[1]}**`
        });

        embedBuilder.setDescription(descStr)

        return embedBuilder
    }
}