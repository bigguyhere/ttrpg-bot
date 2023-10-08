import DiscordJS, { Client, EmbedBuilder } from 'discord.js';
import { ActiveGame } from "../../activegame";
import { AxiosResponse } from 'axios';
import { PkmUtilityFunctions, Type, Games, EmojiTypeMap} from '../../../utility/custom_utility/pkm_utility';
import { PokeDBMove } from './pokedbmoves';

export class PokeDBPKM {
    public imageURL : string | null = null;
    public abilties : string[] = [];
    private movesList : [name : string, label: string | null, url: string][] = [];
    private moves : PokeDBMove[] = [];
    public types : [type1 : Type, type2 : Type] = [Type.NONE, Type.NONE];

    constructor(
        public name : string,
        public region: string | null,
        response : AxiosResponse | null){
        
        this.name = PkmUtilityFunctions.formatTitle(name);
        this.region = region ? PkmUtilityFunctions.formatUpperCase(region) : region;
        const data = response?.data;
        if(data){
            if(data["moves"] && Array.isArray(data["moves"])){
                for(let i = 0; i < data["moves"].length; ++i){
                    const move = data["moves"][i]["move"];
                    const details = data["moves"][i]["version_group_details"];
                    let label : string | null = null;
                    if(details && Array.isArray(details)){
                        
                        let mostRecentGame = 'red-blue';
                        let mostRecentInd = Games[mostRecentGame];
                        for(let k = 0; k < details.length; ++k){
                            const game_details = details[k]["version_group"];
                            if(game_details && game_details["name"] && Games[game_details["name"]] > mostRecentInd){
                                mostRecentInd = Games[game_details["name"]];
                                mostRecentGame = game_details["name"];
                            }
                        }

                        for(let j = 0; j < details.length; ++j){
                            const method = details[j]["move_learn_method"];
                            const game_details = details[j]["version_group"];

                            //Obtains most recent version of each move 
                            if(method && method["name"] && game_details && game_details["name"] && game_details["name"] === mostRecentGame){
                                label = method["name"];
                                break;
                            }
                        }
                    }

                    this.movesList.push([move["name"], label, move["url"]]);
                }
            }

            if(data["types"] && Array.isArray(data["types"])){
                for(let i = 0; i < data["types"].length; ++i){
                    const typeStr = data["types"][i]["type"]["name"] as string;
                    this.types[i] = Type[typeStr.toUpperCase() as keyof typeof Type];
                }
            }

            if(data["abilities"] && Array.isArray(data["abilities"])){
                for(let i = 0; i < data["abilities"].length; ++i){
                    const abilityStr = data["abilities"][i]["ability"]["name"] as string;
                    this.abilties.push(PkmUtilityFunctions.formatStr(abilityStr));
                }
            }

            if(data["sprites"] && data["sprites"]["front_default"]) {
                this.imageURL = data["sprites"]["front_default"];
            }
        }
    }

    public async getMoves() : Promise<PokeDBMove[]>{
        if(this.moves.length > 0){
            return this.moves;
        } else{
            return await PokeDBMove.fetchMoves(this.movesList);
        }
    }

    public async buildViewEmbed(user : DiscordJS.User, client : Client<boolean>, 
        activeGame : ActiveGame): Promise<EmbedBuilder[] | null>{

        const type1 = Type[this.types[0]], type2 = Type[this.types[1]];
        let descStr = `**DM:** ${(await client.users.fetch(activeGame.DM))}\n
                        **Type(s):** ${EmojiTypeMap[type1]} ${type1} ${EmojiTypeMap[type1]}${this.types[1] !== Type.NONE ? ` - ${EmojiTypeMap[type2]} ${type2} ${EmojiTypeMap[type2]}` : ''}
                        **Abilities:**`;

        if(this.abilties){
            for(let ability of this.abilties){
                descStr += ` ${ability} -`
            }

            if(descStr.length > 2){
                descStr = descStr.substring(0, descStr.length - 2);
            }
        }

        descStr += '\n\n**Weaknesses:** ';
        const weaknesses = PkmUtilityFunctions.getWeaknesses(this.types);

        for(let weakness of weaknesses){
            descStr += `${EmojiTypeMap[weakness[0]]} ${weakness[0]} (${weakness[1]}x), `
        }

        if(descStr.length > 2){
            descStr = descStr.substring(0, descStr.length - 2);
        }

        const summaryEmbed = new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name}${this.region ? ` (${this.region})` : ''}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(descStr)
        .setThumbnail(this.imageURL)
        .setTimestamp();

        let embeds : EmbedBuilder[] = [summaryEmbed];

        const moves = await this.getMoves();
        let moveEmbeds = await PokeDBMove.buildSummaryEmbed(user, client, activeGame, this, moves);

        if(moveEmbeds != null){
            for(let embed of moveEmbeds) {
                embeds.push(embed);
            }
        }

        return embeds;
    }

}