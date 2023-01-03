import { CacheType, ChatInputCommandInteraction, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "../models/activegame"
import { Character } from "../models/character"
import { DRCharacter } from "../models/custommodels/drmodels/drcharacter"
import { DRInterpreter } from "./drinterpreter"

export abstract class CustomInterpreter{
    constructor (protected gamedb : Connection, protected tableNameBase: string){
            this.gamedb = gamedb
            this.tableNameBase
    }

    changeTableNameBase(newNameBase : string){
        this.tableNameBase = newNameBase
    }

    async getCharacter(char_name: string): Promise<Character | null>{
        return await Character.getCharacter(this.gamedb, this.tableNameBase, char_name)
    }

    abstract initializeTables(): void
    abstract interpret(
            commandName: string,
            options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
            activeGame: ActiveGame | null,
            interaction: ChatInputCommandInteraction<CacheType>) : Promise<string> 
}

export class DetermineInterpreter{
    static determine(gameType: string | null | undefined, gamedb : Connection, tableNameBase: string): CustomInterpreter | null{
        switch(gameType){
            case 'dr':
                return new DRInterpreter(gamedb, tableNameBase)
        }

        return null
    }
}