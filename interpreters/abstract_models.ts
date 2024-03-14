import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "../models/activegame"
import { Character } from "../models/character"

export class DisabledCommand {
    constructor(public disabledCmd : string,
                public cmdMap : Map<string, string>){
        this.disabledCmd = disabledCmd
        this.cmdMap = cmdMap
    }
}

export class OverridedCommand {
    constructor(public overrideCmd : string,
                public replacementCmd : string){
        this.overrideCmd = overrideCmd
        this.replacementCmd = replacementCmd
    }
}

export abstract class Bridge{
    protected abstract disabledCmds : Array<DisabledCommand>
    protected abstract overridenCmds : Array<OverridedCommand>

    /**
     * @param gamedb - Database connection where game data resides
     * @param tableNameBase - Prefix for all table names 
     */
    constructor (protected gamedb : Connection,
                protected tableNameBase: string){
            this.gamedb = gamedb
            this.tableNameBase
    }

    /**
     * Changes the current base table-name
     * @param newNameBase - New base table-name value
     */
    changeTableNameBase(newNameBase : string){
        this.tableNameBase = newNameBase
    }
    
    getDisabledCmds(): DisabledCommand[] {
        return this.disabledCmds
    }

    getOverridenCmds(): OverridedCommand[] {
        return this.overridenCmds
    }

    getOverrideCmd(cmd : string) : string {
        for( const oCmd of this.overridenCmds) {
            if(oCmd.overrideCmd === cmd){
                return oCmd.replacementCmd
            }
        }

        return cmd
    }

    getDisabledCmd(cmd : string, subCmd : string) : string | undefined{
        for( const dCmd of this.disabledCmds) {
            if(dCmd.disabledCmd === cmd){
                return dCmd.cmdMap.get(subCmd)
            }
        }

        return undefined
    }

    isDisabledCmd(cmd : string, subCmd : string) : boolean{
        return this.disabledCmds.some(dCmd => {
            dCmd.disabledCmd === cmd && dCmd.cmdMap.has(cmd)
        })
    }

    /**
     * Method to be overidden if there is a custom character type
     * @param char_name - Name of character to be retrieved
     * @returns Character with char_name if successful, null if character cannot be found
     */
    async getCharacter(char_name: string): Promise<Character | null>{
        return await Character.getCharacter(this.gamedb, this.tableNameBase, char_name)
    }

    /**
         * Used to create SQL Tables associated with custom
         */
    abstract initializeTables(): void

    abstract parse(
        commandName: string,
        subcommandName : string | null,
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
        activeGame: ActiveGame | null,
        client : Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>) : Promise<string | null>
}

export class BaseBridge extends Bridge {
    protected disabledCmds: DisabledCommand[] = []
    protected overridenCmds: OverridedCommand[] = []

    async parse(commandName: string, 
                subcommandName : string,
                options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                activeGame: ActiveGame | null,
                client : Client<boolean>,
                interaction: ChatInputCommandInteraction<CacheType>): Promise<string> {
        return 'Command Not Found.'
    }

    initializeTables(): void {}
}

export abstract class Interpreter {
    constructor(protected gamedb : Connection, 
                protected tableNameBase : string,
                protected options : Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
                protected client : Client<boolean>,
                protected interaction : ChatInputCommandInteraction<CacheType>){
        this.gamedb = gamedb
        this.tableNameBase = tableNameBase
        this.options = options
        this.client = client
        this.interaction = interaction
    }
}

export class BaseInterpreter extends Interpreter {}