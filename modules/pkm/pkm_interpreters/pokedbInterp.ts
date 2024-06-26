import { Interpreter } from "../../../interpreters/abstract_models";
import axios, { AxiosResponse } from "axios";
import { UtilityFunctions } from "../../../utility/general";
import { PokeDBPKM } from "../pkmmodels/pokedbpkm";
import { ActiveGame } from "../../../models/activegame";
import { Pagination } from "../../../utility/pagination";
import { PkmUtilityFunctions } from "../pkm_utility";
import { PokeDBMove } from "../pkmmodels/pokedbmoves";
import { PokeDBAbility } from "../pkmmodels/pokedbabilities";

export class PokeDBInterpreter extends Interpreter {
    protected apiURL: string = "https://beta.pokeapi.co/graphql/v1beta/";

    public async viewPkm(
        pkmName: string,
        activeGame: ActiveGame
    ): Promise<string | null> {
        let form = UtilityFunctions.formatNullString(
            this.options.getString("form")
        );

        UtilityFunctions.errorCheck(!pkmName, "Name must exist");
        UtilityFunctions.errorCheck(
            typeof pkmName !== "string",
            "Name must be a string"
        );
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(
            pkmName.length === 0,
            "Name cannot be empty"
        );

        let searchParam = "where: {is_default: {_eq: true}}";

        if (form !== null) {
            form = PkmUtilityFunctions.sanitizeFormInput(form, "Form");
            searchParam = `where: {name: {_eq: "${pkmName}-${form}"}}`;
        }

        let result: AxiosResponse | null = null;
        try {
            result = await axios.post(
                this.apiURL,
                PkmUtilityFunctions.getPkmFormQuery(
                    "formQuery",
                    pkmName,
                    searchParam
                )
            );

            if (result !== null && result["data"]) {
                if (result["data"]["errors"]) {
                    throw result["data"]["errors"];
                } else if (
                    result["data"]["data"] &&
                    result["data"]["data"]["species"] &&
                    result["data"]["data"]["species"].length == 0
                ) {
                    throw "No data returned.";
                }
            }
        } catch (e) {
            console.log(e);
            return `Pokemon **\"${pkmName}\"** could not be found.`;
        }

        const pokedb = await PokeDBPKM.getPokemonFromSpecies(
            result,
            pkmName,
            form
        );

        const embed = await pokedb.buildViewEmbed(
            this.interaction.user,
            this.interaction.client,
            activeGame
        );

        await this.interaction.channel?.send({ embeds: [embed] });

        return `Pokemon **${pokedb.name}** has been successfully viewed.`;
    }

    public async viewMoves(
        pkmName: string,
        activeGame: ActiveGame
    ): Promise<string | null> {
        let form = UtilityFunctions.formatNullString(
            this.options.getString("form")
        );
        let learnType = this.options.getNumber("learn-type");

        UtilityFunctions.errorCheck(!pkmName, "Name must exist");
        UtilityFunctions.errorCheck(
            typeof pkmName !== "string",
            "Name must be a string"
        );
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(
            pkmName.length === 0,
            "Name cannot be empty"
        );

        let searchParam = "where: {is_default: {_eq: true}}";

        if (form !== null) {
            form = PkmUtilityFunctions.sanitizeFormInput(form, "Form");
            searchParam = `where: {name: {_eq: "${pkmName}-${form}"}}`;
        }

        let result: AxiosResponse | null = null;
        try {
            result = await axios.post(
                this.apiURL,
                PkmUtilityFunctions.getPkmMoveQuery(
                    "moveQuery",
                    pkmName,
                    searchParam,
                    learnType === null
                        ? ""
                        : `, where: {move_learn_method_id: {_eq: ${learnType}}}`
                )
            );

            if (result !== null && result["data"]) {
                if (result["data"]["errors"]) {
                    throw result["data"]["errors"];
                } else if (
                    result["data"]["data"] &&
                    result["data"]["data"]["species"] &&
                    result["data"]["data"]["species"].length == 0
                ) {
                    throw "No data returned.";
                }
            }
        } catch (e) {
            console.log(e);
            return `Pokemon **\"${pkmName}\"** could not be found.`;
        }

        UtilityFunctions.errorCheck(
            !result ||
                !result.data ||
                !result.data.data ||
                !result.data.data.species ||
                !Array.isArray(result.data.data.species) ||
                result.data.data.species.length !== 1 ||
                !result.data.data.species[0].pokemon ||
                !Array.isArray(result.data.data.species[0].pokemon) ||
                result.data.data.species[0].pokemon.length !== 1,
            "Response is not valid"
        );

        const response = result?.data.data.species[0];
        const pokedb = new PokeDBPKM(pkmName, form, response);
        const moveList = await PokeDBMove.getMoveList(response.pokemon[0]);

        const replyStr = `Pokemon **${pokedb.name}'s** moves have been successfully viewed.`;
        const embeds = await PokeDBMove.buildSummaryEmbed(
            this.interaction.user,
            this.interaction.client,
            activeGame,
            pokedb,
            moveList
        );

        if (embeds == null) {
            return `Error building embed.`;
        }

        if (embeds.length == 0) {
            return "No moves found.";
        }

        if (embeds.length != 1) {
            await Pagination.getPaginatedMessage(
                embeds,
                this.interaction,
                replyStr
            );
            return null;
        }

        await this.interaction.channel?.send({ embeds: [embeds[0]] });

        return replyStr;
    }

    public async viewAbilities(
        pkmName: string,
        activeGame: ActiveGame
    ): Promise<string | null> {
        let form = UtilityFunctions.formatNullString(
            this.options.getString("form")
        );

        UtilityFunctions.errorCheck(!pkmName, "Name must exist");
        UtilityFunctions.errorCheck(
            typeof pkmName !== "string",
            "Name must be a string"
        );
        pkmName = pkmName.trim().toLowerCase();
        UtilityFunctions.errorCheck(
            pkmName.length === 0,
            "Name cannot be empty"
        );

        let searchParam = "where: {is_default: {_eq: true}}";

        if (form !== null) {
            form = PkmUtilityFunctions.sanitizeFormInput(form, "Form");
            searchParam = `where: {name: {_eq: "${pkmName}-${form}"}}`;
        }

        let result: AxiosResponse | null = null;
        try {
            result = await axios.post(
                this.apiURL,
                PkmUtilityFunctions.getPkmAbilityQuery(
                    "moveQuery",
                    pkmName,
                    searchParam
                )
            );

            if (result !== null && result["data"]) {
                if (result["data"]["errors"]) {
                    throw result["data"]["errors"];
                } else if (
                    result["data"]["data"] &&
                    result["data"]["data"]["species"] &&
                    result["data"]["data"]["species"].length == 0
                ) {
                    throw "No data returned.";
                }
            }
        } catch (e) {
            console.log(e);
            return `Pokemon **\"${pkmName}\"** could not be found.`;
        }

        UtilityFunctions.errorCheck(
            !result ||
                !result.data ||
                !result.data.data ||
                !result.data.data.species ||
                !Array.isArray(result.data.data.species) ||
                result.data.data.species.length !== 1 ||
                !result.data.data.species[0].pokemon ||
                !Array.isArray(result.data.data.species[0].pokemon) ||
                result.data.data.species[0].pokemon.length !== 1,
            "Response is not valid"
        );

        const response = result?.data.data.species[0];
        const pokedb = new PokeDBPKM(pkmName, form, response);
        const abilityList = await PokeDBAbility.getAbilityList(
            response.pokemon[0]
        );

        const replyStr = `Pokemon **${pokedb.name}'s** abilities has been successfully viewed.`;
        const embeds = await PokeDBAbility.buildSummaryEmbed(
            this.interaction.user,
            this.interaction.client,
            activeGame,
            pokedb,
            abilityList
        );

        if (embeds == null) {
            return `Error building embed.`;
        }

        if (embeds.length == 0) {
            return "No moves found.";
        }

        if (embeds.length != 1) {
            await Pagination.getPaginatedMessage(
                embeds,
                this.interaction,
                replyStr
            );
            return null;
        }

        await this.interaction.channel?.send({ embeds: [embeds[0]] });

        return replyStr;
    }

    public async viewMove(
        moveName: string,
        activeGame: ActiveGame
    ): Promise<string | null> {
        UtilityFunctions.errorCheck(!moveName, "Name must exist");
        UtilityFunctions.errorCheck(
            typeof moveName !== "string",
            "Name must be a string"
        );
        moveName = UtilityFunctions.formatString(
            moveName,
            /\s/g,
            "-"
        ).toLowerCase();
        UtilityFunctions.errorCheck(
            moveName.length === 0,
            "Name cannot be empty"
        );

        let result: AxiosResponse | null = null;
        try {
            result = await axios.post(
                this.apiURL,
                PkmUtilityFunctions.getMoveQuery("moveViewQuery", moveName)
            );

            if (result !== null && result["data"]) {
                if (result["data"]["errors"]) {
                    throw result["data"]["errors"];
                } else if (
                    result["data"]["data"] &&
                    result["data"]["data"]["move"] &&
                    result["data"]["data"]["move"].length == 0
                ) {
                    throw "No data returned.";
                }
            }
        } catch (e) {
            console.log(e);
            return `Move **\"${moveName}\"** could not be found.`;
        }

        UtilityFunctions.errorCheck(
            !result ||
                !result.data ||
                !result.data.data ||
                !result.data.data.move ||
                !Array.isArray(result.data.data.move) ||
                result.data.data.move.length !== 1,
            "Response is not valid"
        );

        const response = result?.data.data.move[0];
        const move = new PokeDBMove(moveName, response);

        const embed = await move.buildViewEmbed(
            this.interaction.user,
            this.interaction.client,
            activeGame
        );

        await this.interaction.channel?.send({ embeds: [embed] });

        return `Move **${move.name}** has been successfully viewed.`;
    }

    public async viewAbility(
        abilityName: string,
        activeGame: ActiveGame
    ): Promise<string | null> {
        UtilityFunctions.errorCheck(!abilityName, "Name must exist");
        UtilityFunctions.errorCheck(
            typeof abilityName !== "string",
            "Name must be a string"
        );
        abilityName = UtilityFunctions.formatString(
            abilityName,
            /\s/g,
            "-"
        ).toLowerCase();
        UtilityFunctions.errorCheck(
            abilityName.length === 0,
            "Name cannot be empty"
        );

        let result: AxiosResponse | null = null;
        try {
            result = await axios.post(
                this.apiURL,
                PkmUtilityFunctions.getAbilityQuery(
                    "abilityViewQuery",
                    abilityName
                )
            );

            if (result !== null && result["data"]) {
                if (result["data"]["errors"]) {
                    throw result["data"]["errors"];
                } else if (
                    result["data"]["data"] &&
                    result["data"]["data"]["ability"] &&
                    result["data"]["data"]["ability"].length == 0
                ) {
                    throw "No data returned.";
                }
            }
        } catch (e) {
            console.log(e);
            return `Ability **\"${abilityName}\"** could not be found.`;
        }

        UtilityFunctions.errorCheck(
            !result ||
                !result.data ||
                !result.data.data ||
                !result.data.data.ability ||
                !Array.isArray(result.data.data.ability) ||
                result.data.data.ability.length !== 1,
            "Response is not valid"
        );

        const response = result?.data.data.ability[0];
        const ability = new PokeDBAbility(abilityName, response);

        const embed = await ability.buildViewEmbed(
            this.interaction.user,
            this.interaction.client,
            activeGame
        );

        await this.interaction.channel?.send({ embeds: [embed] });

        return `Ability **${ability.name}** has been successfully viewed.`;
    }
}
