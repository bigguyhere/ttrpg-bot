import DiscordJS, { Client, EmbedBuilder } from 'discord.js';
import { ActiveGame } from "../../../models/activegame";
import { AxiosResponse } from 'axios';
import { PkmUtilityFunctions, Type, EmojiTypeMap} from '../pkm_utility';
import { UtilityFunctions } from '../../../utility/general';

export class PokeDBPKM {
    public imageURL : string | null = null;
    public abilties : string[] = [];
    public types : [type1 : Type, type2 : Type] = [Type.NONE, Type.NONE];

    constructor(
        public name : string,
        public form: string | null,
        pkmData? : any | null){
        
        this.name = PkmUtilityFunctions.formatTitle(name);
        this.form = form ? PkmUtilityFunctions.formatUpperCase(form) : form;

        if(pkmData) {
            const data = pkmData["pokemon"][0];

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

            if(data["sprites"] && data["sprites"][0] &&  data["sprites"][0]["sprites"]) {
                this.imageURL = data["sprites"][0]["sprites"];
            }
        }
    }

    public static async getPokemonFromSpecies(response : AxiosResponse | null, name : string, form : string | null) : Promise<PokeDBPKM> {
        UtilityFunctions.errorCheck(!response 
            || !response.data 
            || !response.data.data 
            || !response.data.data.species 
            || !Array.isArray(response.data.data.species) 
            || response.data.data.species.length !== 1
            , "Response is not valid");
        const data = response?.data.data.species[0];
        
        return new PokeDBPKM(name, form, data);
    }

    public async buildViewEmbed(user : DiscordJS.User, client : Client<boolean>, 
        activeGame : ActiveGame): Promise<EmbedBuilder>{

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

        return new EmbedBuilder()
        .setColor(0x7852A9)
        .setTitle(`**${this.name}${this.form ? ` (${this.form})` : ''}**`)
        .setAuthor({ name: `${user.username}`, iconURL: String(user.displayAvatarURL()) })
        .setDescription(descStr)
        .setThumbnail(this.imageURL)
        .setTimestamp();
    }

}