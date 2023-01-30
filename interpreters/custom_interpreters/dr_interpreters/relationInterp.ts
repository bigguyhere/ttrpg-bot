import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { DRRelationship } from "../../../models/custommodels/drmodels/drrelationship"
import { Interpreter } from "../../interpreter_model"

export class RelationshipInterpreter extends Interpreter {

    public async change(charName1 : string, charName2 : string) : Promise<string> {
        const value = this.options.getNumber('value', true)

        let char1 = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, charName2)

        if(char1 == null){
            return 'Error obtaining character 1.'
        } else if(char2 == null){
            return 'Error obtaining character 2.'
        }

        let relationship = await new DRRelationship(char1, char2).getRelationship(this.gamedb, this.tableNameBase)

        if(relationship == null){
            return 'Error obtaining relationship.'
        }

        if(relationship.value == value){
            return `${charName1} and ${charName2}'s relationship is already this value.`
        }

        const [hope, despair] = RelationshipInterpreter.getHD(value)

        char1.updateHD(this.gamedb, this.tableNameBase, hope, despair)
        char2.updateHD(this.gamedb, this.tableNameBase, hope, despair)

        relationship.changeRelationship(this.gamedb, this.tableNameBase, value)

        return `${charName1} and ${charName2}'s relationship has been successfully updated to ${value}`
    }

    public async view(charName1 : string, charName2 : string) : Promise<string> {    
        let char1 = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, charName2)

        if(char1 == null){
            return 'Error obtaining character 1.'
        } else if(char2 == null){
            return 'Error obtaining character 2.'
        }

        let relationship = await new DRRelationship(char1, char2).getRelationship(this.gamedb, this.tableNameBase)

        if(relationship == null){
            return 'Error obtaining relationship.'
        }

        await this.interaction.channel?.send(
            {embeds : [await relationship.buildViewEmbed(this.interaction.user, this.interaction.guild, this.client)] });

        return `${charName1} and ${charName2}'s relationship has been successfully viewed`
    }

    private static getHD(value : number) : [number, number] {
        let hope = 0, despair = 0
        switch(value){
            case(-2):
                despair = 3
                break
            case(-1):
                despair = 1
                break
            case(0):
                break
            case(1):
                hope = 1
                break
            case(2):
                hope = 3
                break
        }

        return [hope, despair]
    }

}