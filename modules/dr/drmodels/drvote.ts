import DiscordJS, { EmbedBuilder } from "discord.js";
import mysql, { Connection, Pool, RowDataPacket } from "mysql2";
import { UtilityFunctions } from "../../../utility/general";
import { DRCharacter } from "./drcharacter";
import { IDRVoteResults } from "./dr_objectDefs";

export class DRVote {
    constructor(public voter: DRCharacter, public vote: DRCharacter) {
        this.voter = voter;
        this.vote = vote;
    }

    public static createTable(db: Connection | Pool, tableNameBase: string) {
        db.execute(
            `CREATE TABLE IF NOT EXISTS ${tableNameBase}_Votes ( 
            Voter INT NOT NULL,
            Vote INT,
            PRIMARY KEY (Voter),
            FOREIGN KEY (Voter) REFERENCES ${tableNameBase}_Characters(CHR_ID),
            FOREIGN KEY (Vote) REFERENCES ${tableNameBase}_Characters(CHR_ID));`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    static generateVotes(
        db: Connection | Pool,
        tableNameBase: string,
        allChars: Array<DRCharacter>
    ) {
        let queryStr = `INSERT INTO ${tableNameBase}_Votes (Voter, Vote)\nVALUES `;

        if (allChars.length == 0) {
            return;
        }

        for (let charInd = 0; charInd < allChars.length - 1; ++charInd) {
            queryStr += `(${allChars[charInd].id}, null),`;
        }

        queryStr += `(${allChars[allChars.length - 1].id}, null);`;

        db.execute(queryStr, (err, res) => {
            if (err) {
                console.log(err);
                throw err;
            }
        });
    }

    public static async dropTable(
        db: Connection | Pool,
        tableNameBase: string
    ) {
        db.execute(
            `DROP TABLE IF EXISTS ${tableNameBase}_Votes;`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    public static async ifExists(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<boolean> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                "SHOW FULL TABLES IN GamesDB WHERE Table_Type LIKE 'BASE TABLE' AND Tables_in_GamesDB LIKE '%_Votes';",
                (err, res) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }

                    return resolve(res.length == 1);
                }
            );
        });
    }

    updateVote(db: Connection | Pool, tableBaseName: string) {
        db.execute(
            `UPDATE ${tableBaseName}_Votes SET Vote = ${this.vote.id}
        WHERE Voter = ${this.voter.id};`,
            (err, res) => {
                if (err) {
                    console.log(err);
                    throw err;
                }
            }
        );
    }

    static getResults(
        db: Connection | Pool,
        tableNameBase: string
    ): Promise<Array<[DRCharacter, number]>> {
        return new Promise((resolve) => {
            db.execute<IDRVoteResults[]>(
                `SELECT ChrTbl.Name as Candidate, ChrTbl.Emote, COUNT(VoteTbl.Voter) as Votes, ChrTbl.Status, ChrTbl.Talent
            FROM ${tableNameBase}_Votes as VoteTbl LEFT JOIN ${tableNameBase}_Characters as ChrTbl 
            ON VoteTbl.Vote=ChrTbl.CHR_ID GROUP BY VoteTbl.Vote ORDER BY Votes DESC;`,
                (err, res) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }

                    let retArr: Array<[DRCharacter, number]> = [];

                    res.forEach(async (result) => {
                        if (result.Candidate != null) {
                            let chr = new DRCharacter(
                                result.Candidate,
                                result.Emote,
                                null,
                                "",
                                result.Talent,
                                -1,
                                -1,
                                0,
                                0,
                                0,
                                0,
                                0
                            );
                            chr.status = result.Status;
                            retArr.push([chr, result.Votes]);
                        }
                    });

                    return resolve(retArr);
                }
            );
        });
    }

    static countRemainingVotes(
        db: Connection | Pool,
        tableBaseName: string
    ): Promise<number> {
        return new Promise((resolve) => {
            db.execute<RowDataPacket[]>(
                `SELECT COUNT(*) as Count FROM ${tableBaseName}_Votes WHERE Vote is null;`,
                (err, res) => {
                    if (err) {
                        console.log(err);
                        throw err;
                    }

                    return resolve(res[0].Count);
                }
            );
        });
    }

    static buildSummaryEmbed(
        client: DiscordJS.Client,
        guild: DiscordJS.Guild | null,
        results: Array<[DRCharacter, number]>,
        paginationLimit: number = 10
    ): EmbedBuilder[] | undefined {
        let embeds: EmbedBuilder[] = [];

        const numEmbeds =
            results.length > 0
                ? Math.ceil(results.length / paginationLimit)
                : 1;

        for (let i = 0; i < numEmbeds; ++i) {
            embeds.push(
                new EmbedBuilder()
                    .setColor(DRCharacter.defaultEmbedColor)
                    .setTitle(`**Voting Summary**`)
                    .setThumbnail(String(guild?.iconURL()))
                    .setTimestamp()
            );

            let descStr = `**Votes:**\n`;

            const curLimit = paginationLimit * (i + 1);
            const limit = curLimit > results.length ? results.length : curLimit;
            for (let j = paginationLimit * i; j < limit; ++j) {
                if (results[j][0] == null) {
                    return undefined;
                }

                let emoteStr = UtilityFunctions.getEmoteDisplay(
                    client,
                    results[j][0].emote
                );
                descStr += `\n${emoteStr} ${results[j][0].name}: **${results[j][1]}**`;
            }

            embeds[i].setDescription(descStr);
        }

        return embeds;
    }
}
