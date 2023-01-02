import { Client, CacheType, ChatInputCommandInteraction} from "discord.js"
import { Connection } from "mysql"
import { ActiveGame } from "./models/activegame"
import { Character } from "./models/character"
import { DRCharacter } from "./models/custommodels/drmodels/drcharacter"
import { DRRelationship } from "./models/custommodels/drmodels/drrelationship"
import { DRChrSkills, DRSkill } from "./models/custommodels/drmodels/drskill"
import { DRChrTBs, DRTruthBullet } from "./models/custommodels/drmodels/drtruthbullet"
import { Inventory } from "./models/inventory"
import { UtilityFunctions }  from './utility'

module CommandInterpreter{
    export async function interpret(interaction: ChatInputCommandInteraction<CacheType>, gamedb: Connection, guildID: string, client: Client<boolean>) : Promise<void> {
        interaction.reply({
            content: await interpretHelper(interaction, gamedb, guildID, client)
        })
    }

    export async function interpretHelper(interaction: ChatInputCommandInteraction<CacheType>, gamedb: Connection, guildID: string, client: Client<boolean>) : Promise<string> {
        ActiveGame.createTable(gamedb)
    
        const { commandName, options } = interaction
        const userId = interaction.user.id
    
        const gameName = options.getString('game-name')?.trim().replace(/ /g, '_')
    
        let activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', guildID, gameName)
                
        const tableNameBase = `${guildID}_${activeGame?.gameName == null? gameName : activeGame?.gameName}`;

        if(commandName === 'create-game'){

            const gameType = options.getString('game-type')
            let DM = options.getUser('dm-name')?.id
    
            DM ??= userId
    
            const newGame = new ActiveGame(guildID, String(gameName), gameType, DM, true)
    
            newGame.addToTable(gamedb)
            
            let additionalStats = Character.parseColumns(String(options.getString('additional-stats')))
            
            if(additionalStats == undefined){
                return 'Issue parsing additional columns.'
            }
    
            Character.createTable(gamedb, tableNameBase, additionalStats)
            Inventory.createTable(gamedb, tableNameBase)
    
            switch(gameType){
                case 'dr': // Danganronpa TTRPG Game
                    DRCharacter.createTable(gamedb, tableNameBase)
                    DRSkill.createTables(gamedb, tableNameBase)
                    DRTruthBullet.createTables(gamedb, tableNameBase)
                    DRRelationship.createTable(gamedb, tableNameBase)
                    break
                case 'pkm': // Pokemon TTRPG Game
                    return 'PokeTTRPG has not been implemented yet.'
                case 'dnd': // Dungeons and Dragons Game
                    return 'DnD has not been implemented yet.'
            }

            return `The game **\"${gameName}\"** has been successfully created.`
        } else if(commandName === 'add-chr'){
    
            const charName = options.getString('chr-name', true)
            const chrUser = options.getUser('chr-owner')
            const stats = options.getString('additional-stats')
            const chrId = chrUser == null ? userId : String(chrUser.id)

            let additionalStats = Character.parseColumns(stats)
            if(additionalStats == undefined){
                return 'Issue parsing additional columns.'
            }
    
            let newChar = new Character(charName, 
                                        UtilityFunctions.getEmojiID(options.getString('emote')),
                                        options.getString('pronouns'),
                                        chrId,
                                        options.getNumber('health'),
                                        0,
                                        additionalStats);
            newChar.addToTable(gamedb, tableNameBase)    
    
            return `The character **\"${charName}\"** has been successfully created.`
        }
        else if(commandName === 'dr-add-chr'){
    
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot add dr character to non-dr game.'
            }
    
            const charName = options.getString('chr-name', true)
            const chrUser = options.getUser('chr-owner')
            const chrId = chrUser == null ? userId : String(chrUser.id)
    
            let newChar = new DRCharacter(charName, 
                                        UtilityFunctions.getEmojiID(options.getString('emote')),
                                        options.getString('pronouns'),
                                        chrId,
                                        options.getString('ult-talent'),
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
        } else if(commandName === 'rmv-chr'){
            const charName = options.getString('chr-name', true)
            const tbdChar = activeGame?.gameType === 'dr' 
                ? await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
                : new Character(charName, null, null, '', -1, -1, [])
    
            tbdChar?.removeFromTable(gamedb, tableNameBase)    
    
            return `The character **\"${charName}\"** has been successfully deleted.`
        } else if(commandName === 'view-chr'){
            const charName = options.getString('chr-name', true)
            const user = interaction.user
            const guild = interaction.guild
            const char = activeGame?.gameType === 'dr'
                ? await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
                : await Character.getCharacter(gamedb, tableNameBase, charName)
    
            if(char == null){
                return `Finding character **\"${charName}\"** was unsuccessful.`
            }
    
            interaction.channel?.send({embeds : [char.buildViewEmbed(user, guild)] });
    
            return `The character **\"${charName}\"** has been successfully viewed.`
        } else if(commandName === 'roll'){
            const query = options.getString('query', true)
            let identifier = options.getString('identifier')

            identifier ??= 'Result'
            identifier += ': '
    
            const result = UtilityFunctions.parseRoll(query)
            
            interaction.reply({content: `${interaction.user} :game_die:\n**${identifier}** ${result?.[0]}\n**Total:** ${result?.[1]}`})
        } else if(commandName === 'change-stat'){
            const charName = options.getString('chr-name', true)
            const statName = options.getString('stat-name', true)
            const statValue = options.getString('stat-value', true)
            
            let tbdChar = new Character(charName, null, null, '', -1, -1, []);
            if(!tbdChar.updateStat(gamedb, tableNameBase, statName, statValue)){
                return 'Cannot update the Name column of a character. Instead please remove the character and replace them with a new one.'
            }

            return `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully been changed to **\"${statValue}\"**.`
        } else if(commandName === 'set-dm'){
            const newDM = options.getUser('newdm-name', true)
    
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            const guild = client.guilds.cache.get(guildID)
            const oldDM = guild?.members.cache.get(activeGame.DM)
    
            activeGame.DM = newDM.id
            activeGame.setDM(gamedb)
    
            return `DM successfully changed to from ${oldDM} to ${newDM}`
        } else if(commandName === 'change-game'){
            new ActiveGame(guildID, String(gameName), '', userId, true).changeGame(gamedb)
    
            return `Game successfully changed to **\"${gameName}\"**`
        } else if(commandName === 'view-summary'){
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }
    
            let embed = Character.buildSummaryEmbed(interaction.user, 
                                                    interaction.guild, 
                                                    activeGame, 
                                                    await Character.getAllCharacters(gamedb, tableNameBase))
    
            if(embed == null){
                return 'Error finding all characters and building embed.'
            }
    
            interaction.channel?.send({embeds : [embed] });
    
            return `The characters in **\"${activeGame.gameName}\"** has been successfully viewed.`
        } else if(commandName === 'dr-view-relationship'){
            const charName1 = options.getString('character-1', true)
            const charName2 = options.getString('character-2', true)
    
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
            const charName1 = options.getString('character-1', true)
            const charName2 = options.getString('character-2', true)
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
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot add dr skill in non-dr game.'
            }
    
            const skillName = options.getString('skill-name', true)
    
            let newSkill = new DRSkill(skillName,
                                        options.getString('prereqs'),
                                        options.getString('description', true),
                                        options.getNumber('sp-cost', true))
    
            newSkill.addToTable(gamedb, tableNameBase)
    
            return `The skill **\"${skillName}\"** has been successfully created.`
        } else if(commandName === 'dr-rmv-skill'){ //can probably consolidate this and add skill into one command with how similar they are
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot add dr skill in non-dr game.'
            }
    
            const skillName = options.getString('skill-name', true)
    
            let tbdSkill = new DRSkill(skillName, '', '', -1)
    
            tbdSkill.removeFromTable(gamedb, tableNameBase)    
    
            return `The skill **\"${skillName}\"** has been successfully removed.`
        } else if(commandName === 'dr-assign-skill'){
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot add dr skill in non-dr game.'
            }
    
            const chrName = options.getString('char-name', true)
            const skillName = options.getString('skill-name', true)
    
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
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot view dr skill in non-dr game.'
            }
    
            const chrName = options.getString('char-name')
            const skillName = options.getString('skill-name')
    
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
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot add dr tb in non-dr game.'
            }
    
            const tbName = options.getString('tb-name', true)
    
            new DRTruthBullet(tbName,
                                options.getString('description', true),
                                options.getNumber('trial'),
                                false).addToTable(gamedb, tableNameBase)
    
            return `'The truth bullet **\"${tbName}\"** has been successfully created.`
        } else if(commandName === 'dr-rmv-tb'){ //can probably consolidate this and add skill into one command with how similar they are
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot remove dr tb in non-dr game.'
            }
    
            const tbName = options.getString('tb-name', true)
    
            new DRTruthBullet(tbName, '', options.getNumber('trial'), false).removeFromTable(gamedb, tableNameBase)    
    
            return `The skill **\"${tbName}\"** has been successfully removed.`
        } else if(commandName === 'dr-assign-tb'){
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot assign dr tb in non-dr game.'
            }
    
            const chrName = options.getString('char-name', true)
            const tbName = options.getString('tb-name', true)
    
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
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot view dr tbs in non-dr game.'
            }
    
            const chrName = options.getString('char-name')
            const tbName = options.getString('tb-name')
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
            if(activeGame?.gameType !== 'dr'){
                return 'Cannot use dr tb in non-dr game.'
            }
    
            const tbName = options.getString('tb-name', true)
    
            new DRTruthBullet(tbName,
                '',
                options.getNumber('trial'),
                false).useTB(gamedb, tableNameBase)
    
            return `Truth bullet **\"${tbName}\"** has been successfully usage toggled.`
        } else if(commandName === 'modify-inv'){
            const chrName = options.getString('char-name', true)
    
            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 
    
            const item = options.getString('item-name', true)
            const quant = options.getNumber('quantity')
            const desc = options.getString('description')
            const weight = options.getNumber('weight')
    
            const inv = await Inventory.getItem(gamedb, tableNameBase, chr.id, item)
    
            if(inv == null){
                return `Error retrieving item ${item} in inventory for ${chrName}.`
            } 
    
            //If doesn't exist, then add new item to inventory
            //If does exist, change quantity (Remove if quantity results in less than 0)
    
            if(inv == false || inv == true){
                let newChrInv = new Inventory(chr.id, item, quant, desc, weight)
    
                if(newChrInv.quantity <= 0){
                    return `Error: Cannot add item ${item} with nonpositive quantity (${quant}).`
                }
    
                newChrInv.addToTable(gamedb, tableNameBase)
    
                return `Character **${chrName}'s** inventory has been successfully updated to add 
                        **${newChrInv.quantity}** of **\"${item}\"**.`
            } else{
                const newQuant = inv.quantity + (quant == null ? 1 : quant);
    
                if(newQuant <= 0){
                    inv.removeFromTable(gamedb, tableNameBase)
    
                    return `Character **${chrName}'s** inventory has been successfully updated to remove 
                            item **\"${item}\"**.`
                }else{
                    inv.updateItem(gamedb, tableNameBase, newQuant, weight, desc)
    
                    return `Character **${chrName}\'s** inventory has been successfully updated to possess 
                            **${newQuant}** of **\"${item}\"**.`
                }
            }
        } else if(commandName == 'view-inv'){
            const chrName = options.getString('char-name', true)
    
            const chr = await Character.getCharacter(gamedb, tableNameBase, chrName)
            if(chr == null){
                return `Error finding character ${chrName}.`
            } 
    
            const itemName = options.getString('item-name')
    
            if(itemName == null){
                const chrItems = await chr.getAllChrItems(gamedb, tableNameBase)
    
                const embedBuilder = chr.buildInventoryEmbed(interaction.user, interaction.guild, chrItems)
                if(embedBuilder == null){
                    return `Error building embed.`
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });
        
                return  `**${chrName}'s** inventory has been successfully viewed.`
            }else{
                if(activeGame == null){
                    return 'Issue retrieving active game.'
                }
    
                const item = await Inventory.getItem(gamedb, tableNameBase, chr.id, itemName)
    
                if(item == null){
                    return 'Error retrieving item.'
                } else if(item == false || item == true){
                    return 'Item does not exist.'
                }
    
                const embedBuilder = item.buildViewEmbed(interaction.user, interaction.guild, activeGame)
                if(embedBuilder == null){
                    return 'Error building embed.'
                }
                
                interaction.channel?.send({embeds : [embedBuilder] });
        
                return `**${chrName}'s** item **${itemName}** has been successfully viewed.`
            }
        }

        return 'Error: Unknown Command.'
    }
    
}

export{CommandInterpreter}