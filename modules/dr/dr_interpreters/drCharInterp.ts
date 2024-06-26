import { DRCharacter } from "../drmodels/drcharacter";
import { UtilityFunctions } from "../../../utility/general";
import { CharacterInterpreter } from "../../../interpreters/charInterp";

export class DRCharacterInterpreter extends CharacterInterpreter {
    public async add(charName: string): Promise<string> {
        const chrUser = this.options.getUser("char-owner");
        const chrId = chrUser == null ? this.userID : String(chrUser.id);

        let newChar = new DRCharacter(
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
            UtilityFunctions.formatNullString(
                this.options.getString("ult-talent")
            ),
            0,
            0,
            this.options.getNumber("brains", true),
            this.options.getNumber("brawn", true),
            this.options.getNumber("nimble", true),
            this.options.getNumber("social", true),
            this.options.getNumber("intuition", true)
        );

        if (!(await newChar.addToTable(this.gamedb, this.tableNameBase))) {
            return `Error: Duplicate character ${charName}`;
        }
        await newChar.generateRelations(this.gamedb, this.tableNameBase);

        return `The character **\"${charName}\"** has been successfully created.`;
    }

    public async viewHD(charName: string): Promise<string> {
        const chr = await DRCharacter.getCharacter(
            this.gamedb,
            this.tableNameBase,
            charName
        );

        if (chr == null) {
            return "Issue getting character.";
        }

        (await this.client.users.fetch(chr.owner)).send(
            `**${charName}'s Hope/Despair:**\n__Hope:__ ***${chr.hope}***\t__Despair:__ ***${chr.despair}***\n__Status:__ **${chr.status}**`
        );

        return `${charName}'s Hope/Despair has been viewed.`;
    }

    public async changeStat(charName: string): Promise<string> {
        const retStr = await super.changeStat(charName);
        let statName = UtilityFunctions.formatString(
            this.options.getString("stat-name", true)
        )
            .trim()
            .toLowerCase();

        if (statName == "hope" || statName == "despair") {
            await new DRCharacter(charName).checkHDNotif(
                this.gamedb,
                this.tableNameBase,
                this.client
            );
        }

        return retStr;
    }
}
