import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { UtilityFunctions } from "../../../utility/general";
import { CharacterInterpreter } from "../../std_interpreters/charInterp"

export class DRCharacterInterpreter extends CharacterInterpreter {

    public async add(charName : string) : Promise<string> {
        const chrUser = this.options.getUser('chr-owner')
        const chrId = chrUser == null ? this.userID : String(chrUser.id)

        let newChar = new DRCharacter(charName, 
                                    UtilityFunctions.getEmojiID(
                                        UtilityFunctions.formatNullString(
                                            this.options.getString('emote'))),
                                    UtilityFunctions.formatNullString(this.options.getString('pronouns')),
                                    chrId,
                                    UtilityFunctions.formatNullString(this.options.getString('ult-talent')),
                                    0,
                                    0,
                                    this.options.getNumber('brains', true),
                                    this.options.getNumber('brawn', true),
                                    this.options.getNumber('nimble', true),
                                    this.options.getNumber('social', true),
                                    this.options.getNumber('intuition', true),
                                    );
        
        if(!newChar.addToTable(this.gamedb, this.tableNameBase)){
            return `Error: Duplicate character ${charName}`
        }
        newChar.generateRelations(this.gamedb, this.tableNameBase)  

        return `The character **\"${charName}\"** has been successfully created.`
    }

    public async viewHD (charName : string) : Promise<string> {
        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)

        if(chr == null){
            return 'Issue getting character.'
        }

        const client = this.interaction.guild?.client

        if(client == undefined){
            return 'Issue finding server.'
        }

        client.users.cache.get(chr.owner)?.send(
            `**${chrName}'s Hope/Despair:**\n__Hope:__ ***${chr.hope}***\t__Despair:__ ***${chr.despair}***\n__Status:__ **${chr.status}**`)

        return `${chrName}'s Hope/Despair has been viewed.`
    }

}