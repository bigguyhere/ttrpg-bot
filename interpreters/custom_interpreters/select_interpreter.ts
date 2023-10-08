import { Connection } from "mysql"
import { BaseBridge, Bridge } from "../interpreter_model"
import { DRBridge } from "./dr_interpreters/dr_bridge"
import { PkmBridge } from "./pkm_interpreters/pkm_bridge"

export class SelectBridge{
    /**
     * Determines which custom interpreter will be used based on game type
     * @param gameType - Two-or-three letter abbreviation of custom game type
     * @param gamedb - Database connection where game data resides
     * @param tableNameBase - Prefix for all table names
     * @returns - Returns a CustomInterpreter inheriting subclass if gameType is found, null otherwise 
     */
    static select(gameType: string | null | undefined, gamedb : Connection, tableNameBase: string): Bridge {
        switch(gameType){
            case 'dr':
                return new DRBridge(gamedb, tableNameBase);
            case 'pkm':
                return new PkmBridge(gamedb, tableNameBase);
        }

        return new BaseBridge(gamedb, tableNameBase);
    }
}