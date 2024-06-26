import { CharacterInterpreter } from "../../../interpreters/charInterp";
import { UtilityFunctions } from "../../../utility/general";
import { PokeCharacter } from "../pkmmodels/pkmcharacter";

export class PokeCharacterInterpreter extends CharacterInterpreter {
    public async add(charName: string): Promise<string> {
        const chrUser = this.options.getUser("char-owner");
        const chrId = chrUser == null ? this.userID : String(chrUser.id);

        let newChar = new PokeCharacter(
            charName,
            UtilityFunctions.getEmojiID(
                UtilityFunctions.formatNullString(
                    this.options.getString("emote")
                )
            ),
            UtilityFunctions.formatNullString(
                this.options.getString("pronouns")
            ),
            chrId,
            this.options.getNumber("heart", true),
            this.options.getNumber("fitness", true),
            this.options.getNumber("research", true),
            this.options.getNumber("tactics", true),
            this.options.getNumber("advancement"),
            this.options.getNumber("exp"),
            this.options.getNumber("money"),
            UtilityFunctions.formatNullString(
                this.options.getString("first-impression")
            ),
            UtilityFunctions.formatNullString(this.options.getString("calling"))
        );

        if (!(await newChar.addToTable(this.gamedb, this.tableNameBase))) {
            return `Error: Duplicate character ${charName}`;
        }

        return `The character **\"${charName}\"** has been successfully created.`;
    }
}
