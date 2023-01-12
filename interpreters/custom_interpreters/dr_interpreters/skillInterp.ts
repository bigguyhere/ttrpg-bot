import { ActiveGame } from "../../../models/activegame"
import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { DRChrSkills, DRSkill } from "../../../models/custommodels/drmodels/drskill"
import { UtilityFunctions } from "../../../utility/general"
import { Interpreter } from "../../interpreter_model"

export class SkillInterpreter extends Interpreter {

    public add() : string {
        const skillName = UtilityFunctions.formatString(this.options.getString('skill-name', true))

        new DRSkill(skillName,
                    UtilityFunctions.formatNullString(this.options.getString('prereqs')),
                    UtilityFunctions.formatString(this.options.getString('description', true)),
                    this.options.getNumber('sp-cost', true)).addToTable(this.gamedb, this.tableNameBase)
        
        return `The skill **\"${skillName}\"** has been successfully created.`
    }

    public remove() : string {    
        const skillName = UtilityFunctions.formatString(this.options.getString('skill-name', true))

        new DRSkill(skillName).removeFromTable(this.gamedb, this.tableNameBase)    

        return `The skill **\"${skillName}\"** has been successfully removed.`
    }

    public async assign() : Promise<string> {    
        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        const skillName = UtilityFunctions.formatString(this.options.getString('skill-name', true))

        const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
        const skill = await DRSkill.getSkill(this.gamedb, this.tableNameBase, skillName)

        if(chr == null){
            return `Error finding character ${chrName}.`
        } 
        
        if (skill == null){
            return `Error finding skill ${skillName}.`
        }

        let newChrSkill = new DRChrSkills(chr.id, skill.id)

        let exists = await newChrSkill.ifExists(this.gamedb, this.tableNameBase)

        if(exists == null){
            return `Error checking if ChrSkill exists.`
        }else if(exists){
            newChrSkill.removeFromTable(this.gamedb, this.tableNameBase)

            return `Removed skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
        }else{
            newChrSkill.addToTable(this.gamedb, this.tableNameBase)

            return `Added skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
        }
    }

    public async view(activeGame : ActiveGame) : Promise<string> {    
        const chrName = UtilityFunctions.formatNullString(this.options.getString('char-name', true))
        const skillName = UtilityFunctions.formatNullString(this.options.getString('skill-name', true))

        if(chrName != null && skillName != null){
            return 'Must choose either Skill summary or Character Skill summary, not both.'
        } else if(chrName != null){

            const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 

            const chrSkills = await chr.getAllChrSkills(this.gamedb, this.tableNameBase)

            const embedBuilder = chr.buildSkillEmbed(this.interaction.user, this.interaction.guild, chrSkills)
            if(embedBuilder == null){
                return `Error building embed.`
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });

            return  `**${chrName}'s** skills has been successfully viewed.`
        } else if(skillName != null){

            const skill = await DRSkill.getSkill(this.gamedb, this.tableNameBase, skillName)
            if(skill == null){
                return `Error finding skill ${skillName}.`
            } 
            
            this.interaction.channel?.send({embeds : [skill.buildViewEmbed(this.interaction.user, this.interaction.guild, activeGame)] });

            return `Skill **\"${skillName}\"** has been successfully viewed`
        } else{
            const allSkills = await DRSkill.getAllSkills(this.gamedb, this.tableNameBase)

            const embedBuilder = DRSkill.buildSummaryEmbed(this.interaction.user, this.interaction.guild, activeGame, allSkills)
            if(embedBuilder == null){
                return `Error building embed.`
            }
            
            this.interaction.channel?.send({embeds : [embedBuilder] });

            return `All skills have been successfully viewed`
        }
    }

}