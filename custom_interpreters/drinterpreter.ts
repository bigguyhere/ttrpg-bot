import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver } from "discord.js";
import { Connection } from "mysql";
import { ActiveGame } from "../models/activegame";
import { DRCharacter } from "../models/custommodels/drmodels/drcharacter";
import { DRRelationship } from "../models/custommodels/drmodels/drrelationship";
import { DRChrSkills, DRSkill } from "../models/custommodels/drmodels/drskill";
import { DRChrTBs, DRTruthBullet } from "../models/custommodels/drmodels/drtruthbullet";
import { UtilityFunctions } from "../utility";

module DRInterpreter{
    export async function custominterpretHelper(
        commandName: string,
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
        activeGame: ActiveGame,
        interaction: ChatInputCommandInteraction<CacheType>, 
        gamedb: Connection,
        tableNameBase: string) : Promise<string> 
    {
        const userId = interaction.user.id

        /*
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot view dr tbs in non-dr game.'
            }
        */
    
        if(commandName === 'dr-add-chr'){    
            const charName = UtilityFunctions.formatString(options.getString('chr-name', true))
            const chrUser = options.getUser('chr-owner')
            const chrId = chrUser == null ? userId : String(chrUser.id)
    
            let newChar = new DRCharacter(charName, 
                                        UtilityFunctions.getEmojiID(
                                            UtilityFunctions.formatNullString(
                                                options.getString('emote'))),
                                        UtilityFunctions.formatNullString(options.getString('pronouns')),
                                        chrId,
                                        UtilityFunctions.formatNullString(options.getString('ult-talent')),
                                        0,
                                        0,
                                        options.getNumber('brains', true),
                                        options.getNumber('brawn', true),
                                        options.getNumber('nimble', true),
                                        options.getNumber('social', true),
                                        options.getNumber('intuition', true),
                                        );
            newChar.addToTable(gamedb, tableNameBase)
            newChar.generateRelations(gamedb, tableNameBase)  
    
            return `The character **\"${charName}\"** has been successfully created.`
        } else if(commandName === 'dr-view-relationship'){
            const charName1 = UtilityFunctions.formatString(options.getString('character-1', true))
            const charName2 = UtilityFunctions.formatString(options.getString('character-2', true))

            let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
            let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

            if(char1 == null){
                return 'Error obtaining character 1.'
            } else if(char2 == null){
                return 'Error obtaining character 2.'
            }

            let relationship = await new DRRelationship(char1, char2).getRelationship(gamedb, tableNameBase)

            if(relationship == null){
                return 'Error obtaining relationship.'
            }

            interaction.channel?.send({embeds : [relationship.buildViewEmbed(interaction.user, interaction.guild)] });

            return `${charName1} and ${charName2}'s relationship has been successfully viewed`
        } else if(commandName === 'dr-change-relationship'){
            const charName1 = UtilityFunctions.formatString(options.getString('character-1', true))
            const charName2 = UtilityFunctions.formatString(options.getString('character-2', true))
            const value = options.getNumber('value', true)

            let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
            let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

            if(char1 == null){
                return 'Error obtaining character 1.'
            } else if(char2 == null){
                return 'Error obtaining character 2.'
            }

            let relationship = new DRRelationship(char1, char2)

            relationship.changeRelationship(gamedb, tableNameBase, value)

            return `${charName1} and ${charName2}'s relationship has been successfully updated to ${value}`
        } else if(commandName === 'dr-add-skill'){
            const skillName = UtilityFunctions.formatString(options.getString('skill-name', true))

            let newSkill = new DRSkill(skillName,
                                        UtilityFunctions.formatNullString(options.getString('prereqs')),
                                        UtilityFunctions.formatString(options.getString('description', true)),
                                        options.getNumber('sp-cost', true))

            newSkill.addToTable(gamedb, tableNameBase)

            return `The skill **\"${skillName}\"** has been successfully created.`
        } else if(commandName === 'dr-rmv-skill'){ //can probably consolidate this and add skill into one command with how similar they are
            const skillName = UtilityFunctions.formatString(options.getString('skill-name', true))

            let tbdSkill = new DRSkill(skillName, '', '', -1)

            tbdSkill.removeFromTable(gamedb, tableNameBase)    

            return `The skill **\"${skillName}\"** has been successfully removed.`
        } else if(commandName === 'dr-assign-skill'){
            const chrName = UtilityFunctions.formatString(options.getString('char-name', true))
            const skillName = UtilityFunctions.formatString(options.getString('skill-name', true))

            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
            const skill = await DRSkill.getSkill(gamedb, tableNameBase, skillName)

            if(chr == null){
                return `Error finding character ${chrName}.`
            } 
            
            if (skill == null){
                return `Error finding skill ${skillName}.`
            }

            let newChrSkill = new DRChrSkills(chr.id, skill.id)

            let exists = await newChrSkill.ifExists(gamedb, tableNameBase)

            if(exists == null){
                return `Error checking if ChrSkill exists.`
            }else if(exists){
                newChrSkill.removeFromTable(gamedb, tableNameBase)

                return `Removed skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
            }else{
                newChrSkill.addToTable(gamedb, tableNameBase)

                return `Added skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
            }
        } else if(commandName === 'dr-view-skills'){
            const chrName = UtilityFunctions.formatNullString(options.getString('char-name', true))
            const skillName = UtilityFunctions.formatNullString(options.getString('skill-name', true))

            if(chrName != null && skillName != null){
                return 'Must choose either Skill summary or Character Skill summary, not both.'
            } else if(chrName != null){

                const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
                if(chr == null){
                    return `Error finding character ${chrName}.`
                } 

                const chrSkills = await chr.getAllChrSkills(gamedb, tableNameBase)

                const embedBuilder = chr.buildSkillEmbed(interaction.user, interaction.guild, chrSkills)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });

                return  `**${chrName}'s** skills has been successfully viewed.`
            } else if(skillName != null){

                const skill = await DRSkill.getSkill(gamedb, tableNameBase, skillName)
                if(skill == null){
                    return `Error finding skill ${skillName}.`
                } 
                
                interaction.channel?.send({embeds : [skill.buildViewEmbed(interaction.user, interaction.guild, activeGame)] });

                return `Skill **\"${skillName}\"** has been successfully viewed`
            } else{
                const allSkills = await DRSkill.getAllSkills(gamedb, tableNameBase)

                const embedBuilder = DRSkill.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, allSkills)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });

                return `All skills have been successfully viewed`
            }
        }else if(commandName === 'dr-add-tb'){
            const tbName = UtilityFunctions.formatString(options.getString('tb-name', true))

            new DRTruthBullet(tbName,
                                UtilityFunctions.formatString(options.getString('description', true)),
                                options.getNumber('trial'),
                                false).addToTable(gamedb, tableNameBase)

            return `'The truth bullet **\"${tbName}\"** has been successfully created.`
        } else if(commandName === 'dr-rmv-tb'){ //can probably consolidate this and add skill into one command with how similar they are
            const tbName = UtilityFunctions.formatString(options.getString('tb-name', true))

            new DRTruthBullet(tbName, '', options.getNumber('trial'), false).removeFromTable(gamedb, tableNameBase)    

            return `The skill **\"${tbName}\"** has been successfully removed.`
        } else if(commandName === 'dr-assign-tb'){
            const chrName = UtilityFunctions.formatString(options.getString('char-name', true))
            const tbName = UtilityFunctions.formatString(options.getString('tb-name', true))

            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
            const tb = await DRTruthBullet.getTB(gamedb, tableNameBase, tbName, options.getNumber('trial'))

            if(chr == null){
                return `Error finding character ${chrName}.`
            } 
            
            if (tb == null){
                return `Error finding truth bullet ${tbName}.`
            }

            let newChrTB = new DRChrTBs(chr.id, tb.id)

            let exists = await newChrTB.ifExists(gamedb, tableNameBase)

            if(exists == null){
                return `Error checking if ChrTB exists.`
            }else if(exists){
                newChrTB.removeFromTable(gamedb, tableNameBase)

                return `Removed truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
            }else{
                newChrTB.addToTable(gamedb, tableNameBase)

                return `Added truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
            }
        } else if(commandName === 'dr-view-tbs'){

            const chrName = UtilityFunctions.formatNullString(options.getString('char-name'))
            const tbName = UtilityFunctions.formatNullString(options.getString('tb-name'))
            const trialNum = options.getNumber('trial')

            if(chrName != null && tbName != null){
                return 'Must choose either Truth Bullet summary or Character Truth Bullet summary, not both.'
            } else if(chrName != null){
                
                const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
                if(chr == null){
                    return `Error finding character ${chrName}.`
                } 

                const chrSkills = await chr.getAllChrTBs(gamedb, tableNameBase, trialNum)

                const embedBuilder = chr.buildTBEmbed(interaction.user, interaction.guild, chrSkills)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });

                return `**${chrName}'s** truth bullets has been successfully viewed.`
            } else if(tbName != null){
                
                const tb = await DRTruthBullet.getTB(gamedb, tableNameBase, tbName, trialNum)
                if(tb == null){
                    return `Error finding truth bullet ${tbName}.`
                } 
                
                interaction.channel?.send({embeds : [tb.buildViewEmbed(interaction.user, interaction.guild, activeGame)] });

                return `Truth Bullet **\"${tbName}\"** has been successfully viewed.`
            } else{
                const allTBs = await DRTruthBullet.getAllTBs(gamedb, tableNameBase, trialNum)

                const embedBuilder = DRTruthBullet.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, allTBs)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });

                return 'All truth bullets have been successfully viewed.'
            } 
        } else if(commandName === 'dr-use-tb'){

            const tbName = UtilityFunctions.formatString(options.getString('tb-name', true))

            new DRTruthBullet(tbName,
                '',
                options.getNumber('trial'),
                false).useTB(gamedb, tableNameBase)

            return `Truth bullet **\"${tbName}\"** has been successfully usage toggled.`
        }
        
        return 'Error: Unknown DR Command.'
    }
}

export{DRInterpreter}