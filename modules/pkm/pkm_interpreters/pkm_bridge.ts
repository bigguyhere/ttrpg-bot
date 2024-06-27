import { Connection, Pool } from "mysql2";
import {
    Bridge,
    DisabledCommand,
    OverridedCommand,
} from "../../../interpreters/abstract_models";
import {
    CacheType,
    ChatInputCommandInteraction,
    Client,
    CommandInteractionOptionResolver,
} from "discord.js";
import { ActiveGame } from "../../../models/activegame";
import { PokeDBInterpreter } from "./pokedbInterp";
import { UtilityFunctions } from "../../../utility/general";
import { PokeCharacter } from "../pkmmodels/pkmcharacter";
import { PokeCharacterInterpreter } from "./pkmCharInterp";

export class PkmBridge extends Bridge {
    protected disabledCmds: DisabledCommand[];
    protected overridenCmds: OverridedCommand[];

    constructor(gamedb: Connection | Pool, tableNameBase: string) {
        super(gamedb, tableNameBase);
        this.disabledCmds = [
            new DisabledCommand(
                "character",
                new Map<string, string>([
                    ["add", "pkm-character add-character"],
                ])
            ),
        ];
        this.overridenCmds = [
            new OverridedCommand("character", "pkm-character"),
        ];
    }
    async getCharacter(char_name: string): Promise<PokeCharacter | null> {
        return await PokeCharacter.getCharacter(
            this.gamedb,
            this.tableNameBase,
            char_name
        );
    }

    initializeTables() {
        PokeCharacter.createTable(this.gamedb, this.tableNameBase);
        return true;
    }

    async parse(
        commandName: string,
        subcommandName: string | null,
        options: Omit<
            CommandInteractionOptionResolver<CacheType>,
            "getMessage" | "getFocused"
        >,
        activeGame: ActiveGame | null,
        client: Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>
    ): Promise<string | null> {
        if (commandName === "poke-db") {
            const pokeDBInterpreter = new PokeDBInterpreter(
                this.gamedb,
                this.tableNameBase,
                options,
                client,
                interaction
            );
            const name = UtilityFunctions.formatString(
                options.getString("name", true)
            );
            switch (subcommandName) {
                case "pkm-view":
                    if (activeGame == null) {
                        return "Issue retrieving active game.";
                    }
                    return pokeDBInterpreter.viewPkm(name, activeGame);
                case "pkm-moves":
                    if (activeGame == null) {
                        return "Issue retrieving active game.";
                    }
                    return pokeDBInterpreter.viewMoves(name, activeGame);
                case "pkm-abilities":
                    if (activeGame == null) {
                        return "Issue retrieving active game.";
                    }
                    return pokeDBInterpreter.viewAbilities(name, activeGame);
                case "move":
                    if (activeGame == null) {
                        return "Issue retrieving active game.";
                    }
                    return pokeDBInterpreter.viewMove(name, activeGame);
                case "ability":
                    if (activeGame == null) {
                        return "Issue retrieving active game.";
                    }
                    return pokeDBInterpreter.viewAbility(name, activeGame);
            }
        } else if (commandName === "pkm-character") {
            const pkmCharInterpreter = new PokeCharacterInterpreter(
                this.gamedb,
                this.tableNameBase,
                options,
                client,
                interaction
            );
            const charName = UtilityFunctions.formatString(
                options.getString("char-name", true)
            );
            switch (subcommandName) {
                case "add":
                    return await pkmCharInterpreter.add(charName);
                case "remove":
                    return await pkmCharInterpreter.remove(charName);
                case "change-stat":
                    return await pkmCharInterpreter.changeStat(charName);
                case "view":
                    return await pkmCharInterpreter.view(charName, this);
            }
        }

        return "Error: Unknown Pkm Command.";
    }
}
