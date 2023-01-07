import { Connection } from "mysql"
import { BaseInterpreter, CustomInterpreter } from "./custom_interpreter"
import { DRInterpreter } from "./drinterpreter"

export class DetermineInterpreter{
    /**
     * Determines which custom interpreter will be used based on game type
     * @param gameType - Two-or-three letter abbreviation of custom game type
     * @param gamedb - Database connection where game data resides
     * @param tableNameBase - Prefix for all table names
     * @returns - Returns a CustomInterpreter inheriting subclass if gameType is found, null otherwise 
     */
    static select(gameType: string | null | undefined, gamedb : Connection, tableNameBase: string): CustomInterpreter | null{
        switch(gameType){
            case 'dr':
                return new DRInterpreter(gamedb, tableNameBase)
        }

        return new BaseInterpreter(gamedb, tableNameBase)
    }
}