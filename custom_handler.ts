import { CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { DRInterpreter } from "./custom_interpreters/drinterpreter"
import { ActiveGame } from "./models/activegame"
import { DRCharacter } from "./models/custommodels/drmodels/drcharacter"
import { DRRelationship } from "./models/custommodels/drmodels/drrelationship"
import { DRSkill } from "./models/custommodels/drmodels/drskill"
import { DRTruthBullet } from "./models/custommodels/drmodels/drtruthbullet"

module CustomHandler{
    //TODO: Make Object so that gameType, gamedb, and tableNameBase can just be stored
    //TODO: Make object contain enum that determines the createTable and and interpreter methods so never needs to be repeatedly compared
    /**
     * Ho To:
     * Implement with custom Interpreters in the switch-case statement
     */
    export function initializeTables(gameType: string | null,
                                    gamedb : Connection,
                                    tableNameBase: string){
        switch(gameType){
            case 'dr': // Danganronpa TTRPG Game
                DRCharacter.createTable(gamedb, tableNameBase)
                DRSkill.createTables(gamedb, tableNameBase)
                DRTruthBullet.createTables(gamedb, tableNameBase)
                DRRelationship.createTable(gamedb, tableNameBase)
                break
            case 'pkm': // Pokemon TTRPG Game
                return 'PokeTTRPG has not been implemented yet.'
            case 'dnd': // Dungeons and Dragons Game
                return 'DnD has not been implemented yet.'
        }
    }

    export async function determineInterpreter(gameType: string | null,
                                                commandName: string,
                                                options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                                                activeGame: ActiveGame,
                                                interaction: ChatInputCommandInteraction<CacheType>, 
                                                gamedb: Connection,
                                                tableNameBase: string): Promise<string>{
        switch(gameType){
            case 'dr': // Danganronpa TTRPG Game
                return DRInterpreter.custominterpretHelper(commandName, options, activeGame, interaction, gamedb, tableNameBase)
            case 'pkm': // Pokemon TTRPG Game
                return 'PokeTTRPG has not been implemented yet.'
            case 'dnd': // Dungeons and Dragons Game
                return 'DnD has not been implemented yet.'
        }

        return 'Error: Unknown Command.'
    }
}
export {CustomHandler}