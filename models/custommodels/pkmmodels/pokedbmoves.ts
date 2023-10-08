import DiscordJS, { Client, EmbedBuilder } from 'discord.js';
import axios, { AxiosResponse } from 'axios';
import { EmojiTypeMap, PkmUtilityFunctions, Status, StatusEffect, Type } from '../../../utility/custom_utility/pkm_utility'
import { PokeDBPKM } from './pokedbpkm';
import { ActiveGame } from '../../activegame';

export class PokeDBMove {
    public statusList : Status[] = [];
    public effect : string | null = null;
    public type : Type = Type.NONE;

    constructor(
        public name : string,
        response : AxiosResponse,
        public label? : string | null){
        
        this.name = PkmUtilityFunctions.formatStr(name);
        this.label = label;
        const data = response.data;
        if(data){
            const entries = data["effect_entries"];
            if(entries && Array.isArray(entries) && entries.length > 0){
                this.effect = entries[0]["short_effect"] as string;
            }

            if(data["type"] && data["type"]["name"]){
                this.type = Type[data["type"]["name"].toUpperCase() as keyof typeof Type];
            }

            if(data["meta"]){
                const metadata = data["meta"];
                if(metadata["ailment"] && metadata["ailment"]["name"]){
                    const key = metadata["ailment"]["name"];
                    const value = StatusEffect[key];
                    if(key && key.toLowerCase() !== 'none' && value){
                        this.statusList.push({
                            name: key,
                            value: -1,
                            emoji: value
                        });
                    }
                }

                if(metadata["flinch_chance"]){
                    const value = StatusEffect["flinch"];
                    this.statusList.push({
                        name: "flinch",
                        value: metadata["flinch_chance"],
                        emoji: value
                    });
                }
            }

            if(data["stat_changes"]){
                const stats = data["stat_changes"];
                let increase = false, decrease = false;
                for(let i = 0; i < stats.length; ++i){
                    if(stats[i]["change"] > 0){
                        increase = true;
                    } else {
                        decrease = true;
                    }
                } 

                if(increase){
                    const value = StatusEffect["increaseStat"];
                    this.statusList.push({
                        name: "increaseStat",
                        value: 1,
                        emoji: value
                    });
                }
                
                if(decrease){
                    const value = StatusEffect["decreaseStat"];
                    this.statusList.push({
                        name: "decreaseStat",
                        value: -1,
                        emoji: value
                    });
                }
            }
        } 
    }

    public static async fetchMoves(moveList : [name : string, label: string | null, url: string][]) : Promise<PokeDBMove[]>{
        let moves : PokeDBMove[] = []; 
        for(let move of moveList){
            moves.push(new PokeDBMove(move[0], await axios.get(move[2]), move[1]));
        }
        return moves;
    }

    private static pruneMoves(moves : Array<PokeDBMove>){
        return moves.filter( (move) => {
            return move.label !== null;
        }).sort((move1, move2) => {
            const lbl1 = !move1.label ? '' : move1.label;
            const lbl2 = !move2.label ? '' : move2.label;
            
            if(lbl1 > lbl2){
                return 1;
            } else if (lbl1 < lbl2){
                return -1;
            } else{
                return 0;
            }
        });
    }

    public static async buildSummaryEmbed(user : DiscordJS.User, client : Client<boolean>, activeGame : ActiveGame,
         pkm : PokeDBPKM, moves : Array<PokeDBMove> | null, paginationLimit : number = 10): Promise<EmbedBuilder[] | null>{
        
        if(moves == null){
            return null
        }

        let embeds : EmbedBuilder[] = [];
        moves = this.pruneMoves(moves);
        const numEmbeds = moves.length > 0 ? Math.ceil(moves.length / paginationLimit) : 1;

        for(let i = 0; i < numEmbeds; ++i){
            embeds.push(new EmbedBuilder()
            .setColor(0x7852A9)
            .setTitle(`**${pkm.name} Move Summary Page ${i + 1}**`)
            .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
            .setThumbnail(pkm.imageURL)
            .setTimestamp())

            let descStr = `**DM:** ${(await client.users.fetch(activeGame.DM))}\n`;
            
            const curLimit = paginationLimit * (i + 1)
            const limit = curLimit > moves.length ? moves.length : curLimit
            for(let j = paginationLimit * i; j < limit; ++j){
                const typeEmoji = EmojiTypeMap[Type[moves[j].type]]
                descStr += `\n${typeEmoji} **${moves[j].name}** - ${PkmUtilityFunctions.formatStr(String(moves[j].label))}`;
                if(moves[j].statusList.length > 0){
                    descStr += ' - ';
                    for(let status of moves[j].statusList){
                        descStr += status.emoji;
                    }
                }
            }
    
            embeds[i].setDescription(descStr)
        }

        return embeds;
    }
}