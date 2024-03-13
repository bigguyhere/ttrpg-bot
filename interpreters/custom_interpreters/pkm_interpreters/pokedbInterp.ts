import { Interpreter } from "../../interpreter_model";
import axios, { AxiosResponse } from 'axios';
import { UtilityFunctions } from '../../../utility/general'
import { PokeDBPKM } from "../../../models/custommodels/pkmmodels/pokedbpkm";
import { ActiveGame } from "../../../models/activegame";
import { Pagination } from "../../../utility/pagination";
import { PkmUtilityFunctions } from "../../../utility/custom_utility/pkm_utility";
import { PokeDBMove } from "../../../models/custommodels/pkmmodels/pokedbmoves";

export class PokeDBInterpreter extends Interpreter {
    protected apiURL : string = 'https://beta.pokeapi.co/graphql/v1beta/'

    public async view(pkmName : string, activeGame : ActiveGame) : Promise<string | null> { 

        let form = UtilityFunctions.formatNullString(this.options.getString('form'));

        UtilityFunctions.errorCheck(!pkmName, 'Name must exist');
        UtilityFunctions.errorCheck(typeof pkmName !== 'string', 'Name must be a string');
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(pkmName.length === 0, 'Name cannot be empty');

        let searchParam = 'where: {is_default: {_eq: true}}';

        if(form !== null) {
            form = PkmUtilityFunctions.sanitizeFormInput(form, "Form");
            searchParam =  `where: {name: {_eq: "${pkmName}-${form}"}}`;
        }

        let result : AxiosResponse | null = null;
        try{
            result = await axios.post(this.apiURL, PkmUtilityFunctions.getPkmFormQuery('formQuery', pkmName, searchParam));
            if(result !== null && result["data"]["errors"])
                throw result["data"]["errors"];
        } catch(e){
            console.log(e);
            return `Pokemon **\"${pkmName}\"** could not be found.`
        }

        const pokedb = await PokeDBPKM.getPokemonFromSpecies(result, pkmName, form);

        const embed = await pokedb.buildViewEmbed(this.interaction.user, this.interaction.client, activeGame);

        await this.interaction.channel?.send({ embeds : [embed]});

        return `Pokemon **${pokedb.name}** has been successfully viewed.`;
    }

    public async viewMoves(pkmName : string, activeGame : ActiveGame) : Promise<string | null> { 

        let form = UtilityFunctions.formatNullString(this.options.getString('form'));

        UtilityFunctions.errorCheck(!pkmName, 'Name must exist');
        UtilityFunctions.errorCheck(typeof pkmName !== 'string', 'Name must be a string');
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(pkmName.length === 0, 'Name cannot be empty');

        let searchParam = 'where: {is_default: {_eq: true}}';

        if(form !== null) {
            form = PkmUtilityFunctions.sanitizeFormInput(form, "Form");
            searchParam =  `where: {name: {_eq: "${pkmName}-${form}"}}`;
        }

        let result : AxiosResponse | null = null;
        try{
            result = await axios.post(this.apiURL, PkmUtilityFunctions.getPkmMoveQuery('moveQuery', pkmName, searchParam));
            if(result !== null && result["data"]["errors"])
                throw result["data"]["errors"];
        } catch(e){
            console.log(e);
            return `Pokemon **\"${pkmName}\"** could not be found.`
        }

        UtilityFunctions.errorCheck(!result
            || !result.data 
            || !result.data.data 
            || !result.data.data.species 
            || !Array.isArray(result.data.data.species) 
            || result.data.data.species.length !== 1
            || !result.data.data.species[0].pokemon 
            || !Array.isArray(result.data.data.species[0].pokemon) 
            || result.data.data.species[0].pokemon.length !== 1
            , "Response is not valid");

        const response = result?.data.data.species[0];
        const pokedb = new PokeDBPKM(pkmName, form, response);
        const moveList = await PokeDBMove.getMoveList(response.pokemon[0]);

        const replyStr = `Pokemon **${pokedb.name}** has been successfully viewed.`;
        const embeds = await PokeDBMove.buildSummaryEmbed(this.interaction.user, this.interaction.client, activeGame, pokedb, moveList);

        if(embeds == null){
            return `Error building embed.`
        }

        if(embeds.length == 0) {
            return 'No moves found.';
        }
        
        if(embeds.length != 1){
            await Pagination.getPaginatedMessage(embeds, this.interaction, replyStr)
            return null
        } 

        await this.interaction.channel?.send({ embeds : [embeds[0]]});

        return replyStr;
    }

}