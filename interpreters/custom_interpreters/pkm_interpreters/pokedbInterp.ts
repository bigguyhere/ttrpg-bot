import { Interpreter } from "../../interpreter_model";
import axios, { AxiosResponse } from 'axios';
import { UtilityFunctions } from '../../../utility/general'
import { PokeDBPKM } from "../../../models/custommodels/pkmmodels/pokedbpkm";
import { ActiveGame } from "../../../models/activegame";
import { Pagination } from "../../../utility/pagination";

export class PokeDBInterpreter extends Interpreter {
    protected apiURL : string = 'https://pokeapi.co/api/v2/'

    public async view(pkmName : string, activeGame : ActiveGame) : Promise<string | null> { 

        let region = UtilityFunctions.formatNullString(this.options.getString('region'));

        UtilityFunctions.errorCheck(!pkmName, 'Name must exist');
        UtilityFunctions.errorCheck(typeof pkmName !== 'string', 'Name must be a string');
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(pkmName.length === 0, 'Name cannot be empty');

        let queryParam = pkmName; 

        if(region !== null) {
            UtilityFunctions.errorCheck(!region, 'Region must exist');
            UtilityFunctions.errorCheck(typeof region !== 'string', 'Region must be a string');
            region = region.trim().toLowerCase();
            UtilityFunctions.errorCheck(region.length === 0, 'Region cannot be empty');

            queryParam += `-${region}`;
        }

        let result : AxiosResponse | null = null;
        try{
            result = await axios.get(`${this.apiURL}pokemon/${queryParam}`);
        } catch(e){
            return `Pokemon **\"${pkmName}\"** could not be found.`
        }

        const pokedb = new PokeDBPKM(pkmName, region, result);

        const replyStr = `Pokemon **${pokedb.name}** has been successfully viewed.`;

        const embeds = await pokedb.buildViewEmbed(this.interaction.user, this.interaction.client, activeGame);
        
        if(embeds == null){
            return `Error building embed.`
        }

        if(embeds.length == 0) {
            return 'No pokemon found.';
        }
        
        if(embeds.length != 1){
            await Pagination.getPaginatedMessage(embeds, this.interaction, replyStr)
            return null;
        } 

        await this.interaction.channel?.send({ embeds : [embeds[0]]});

        return replyStr;
    }

}