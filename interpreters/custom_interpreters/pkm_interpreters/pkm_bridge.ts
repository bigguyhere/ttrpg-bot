import { Connection } from "mysql";
import { Bridge, DisabledCommand, OverridedCommand } from "../../interpreter_model";
import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js";
import { ActiveGame } from "../../../models/activegame";
import { PokeDBInterpreter } from "./pokedbInterp";
import { UtilityFunctions } from "../../../utility/general";

export class PkmBridge extends Bridge {
    protected disabledCmds: DisabledCommand[];
    protected overridenCmds: OverridedCommand[];

    constructor (gamedb : Connection,
            tableNameBase: string){
           super(gamedb, tableNameBase)
           this.disabledCmds = [
            ]
            this.overridenCmds = [
            ]
    }

    /*async getCharacter(char_name: string): Promise<DRCharacter | null>{
        return await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, char_name)
    }*/

    initializeTables() {
        return true;
    }

    async parse(
        commandName: string,
        subcommandName : string | null,
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
        activeGame: ActiveGame | null,
        client : Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>) : Promise<string | null> 
    {
        if(commandName === 'poke-db'){
            const pokeDBInterpreter = new PokeDBInterpreter(this.gamedb, this.tableNameBase, options, client, interaction);
            const name = UtilityFunctions.formatString(options.getString('name', true));
            switch(subcommandName) {
                case('pkm-view'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.';
                    }
                    return pokeDBInterpreter.viewPkm(name, activeGame);
                case('pkm-moves'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.';
                    }
                    return pokeDBInterpreter.viewMoves(name, activeGame);
                case('move'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.';
                    }
                    return pokeDBInterpreter.viewMove(name, activeGame);
            }
        }

        return 'Error: Unknown Pkm Command.'
    }
}