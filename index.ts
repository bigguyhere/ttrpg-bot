import DiscordJS, { Client, GatewayIntentBits, Events, EmbedBuilder } from 'discord.js'
import {UtilityFunctions}  from './utility'
import dotenv from 'dotenv'
import mysql from 'mysql'
import { ActiveGame, Character, DRCharacter, DRChrSkills, DRChrTBs, DRRelationship, DRSkill, DRTruthBullet, Inventory } from './models'

var DrCharacter = require('./models.ts').Character

dotenv.config()

const client = new DiscordJS.Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
})

const gamesDBName = process.env.DATABASE

const gamedb = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: gamesDBName,
    charset : 'utf8mb4'
})

gamedb.connect( (err) => {
    if(err){
        console.log(`Issue Connecting to MYSQL Database. ${err}`)
    }
    return
})

client.on('ready', () => {
    console.log('Bot is ready.')

    gamedb.query(`CREATE DATABASE IF NOT EXISTS ${gamesDBName}`, (err, res) => {
        if(err){
            console.log(err)
        }
    })

    const guildID = '1032153970254282753'

    const guild = client.guilds.cache.get(guildID)
    let commands

    if(guild){
        commands = guild.commands
    } else{
        commands = client.application?.commands
    }
    
    // Create Game Command
    commands?.create({
        name: 'create-game',
        description: 'Creates game',
        options: [
            {
                name: 'game-name',
                description: 'Name of the TTRPG to be created.',
                required: true,
                type: 3
            },
            {
                name: 'dm-name',
                description: 'User who will be the DM of the created game. Defaults to user who set command.',
                required: false,
                type: 6
            },
            {
                name: 'game-type',
                description: 'Load Predefined TTRPG (Currently Implemented: DR).',
                required: false,
                type: 3
            },
            {
                name: 'additional-stats',
                description: 'Entered in form of "[Stat-Name-1]|[Data-Type],[Stat-Name-2],...". [Data-Type] is optional.',
                required: false,
                type: 3
            }
        ]
    })

    // Add DR Character Command
    commands?.create({
        name: 'dr-add-chr',
        description: 'Adds a character to the game.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'brains',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'brawn',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'nimble',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'social',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'intuition',
                description: 'Brains stat value.',
                required: true,
                type: 10
            },
            {
                name: 'emote',
                description: 'Emote of character to be displayed. Must be an emote on this server.',
                required: false,
                type: 3
            },
            {
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr-owner',
                description: 'User who owns the character, defaults to the user who executed the command.',
                required: false,
                type: 6
            },
            {
                name: 'ult-talent',
                description: 'Character\'s ultimate talent.',
                required: false,
                type: 3
            },
            {
                name: 'skills-list',
                description: 'List of skills for the character, should be less than the SP Total.',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be added to. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Remove Character Command
    commands?.create({
        name: 'rmv-chr',
        description: 'Removes character from the game',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be removed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View Character Command
    commands?.create({
        name: 'view-chr',
        description: 'View a character of a specific name.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be viewed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Roll Command
    commands?.create({
        name: 'roll',
        description: 'Rolls dice.',
        options: [
            {
                name: 'query',
                description: 'Query for dice roll. Should be in the form of [Number]d[Sides of Dice] +/- [Modifierd]',
                required: true,
                type: 3
            },
            {
                name: 'identifier',
                description: 'Replace "Result:" in roll with identifier.',
                required: false,
                type: 3
            }
        ]
    })

    // Change Game Command
    commands?.create({
        name: 'change-game',
        description: 'Changes active game on server.',
        options: [
            {
                name: 'game-name',
                description: 'Name of the new active game.',
                required: true,
                type: 3
            }
        ]
    })

    // Change Stats Command
    commands?.create({
        name: 'change-stat',
        description: 'Changes stat of a character.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character whose stat should be changed.',
                required:true,
                type: 3
            },
            {
                name: 'stat-name',
                description: 'Name of stat to be changed.',
                required: true,
                type: 3
            },
            {
                name: 'stat-value',
                description: 'Value of stat to be changed.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game where character\'s stats will be changed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Set DM Command
    commands?.create({
        name: 'set-dm',
        description: 'Changes active game on server.',
        options: [
            {
                name: 'newdm-name',
                description: 'User who will be the new DM of the specified.',
                required: true,
                type: 6
            },
            {
                name: 'game-name',
                description: 'Game for which DM will be changed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Add Character Command
    commands?.create({
        name: 'add-chr',
        description: 'Adds a character to the game.',
        options: [
            {
                name: 'chr-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'emote',
                description: 'Emote of character to be displayed. Must be an emote on this server.',
                required: false,
                type: 3
            },
            {
                name: 'pronouns',
                description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                required: false,
                type: 3
            },
            {
                name: 'chr-owner',
                description: 'User who owns the character, defaults to the user who executed the command.',
                required: false,
                type: 6
            },
            {
                name: 'health',
                description: 'Numerical value for health.',
                required: false,
                type: 10
            },
            {
                name: 'additional-stats',
                description: 'Additional stats to be added. Format in "[Stat-Name-1]|[Value-1],[Stat-Name-2]|[Value-2],...".',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character should be added. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View Summary Command
    commands?.create({
        name: 'view-summary',
        description: "View Summary of all characters in currently active game.",
        options:[
            {
                name: 'game-name',
                description: 'Game for which summary should be found for. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View Relationship Command
    commands?.create({
        name: 'dr-view-relationship',
        description: 'View relationship between two characters',
        options: [
            {
                name: 'character-1',
                description: 'Name of character 1.',
                required: true,
                type: 3
            },
            {
                name: 'character-2',
                description: 'Name of character 2.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Change Relationship Command
    commands?.create({
        name: 'dr-change-relationship',
        description: 'View relationship between two characters',
        options: [
            {
                name: 'character-1',
                description: 'Name of character 1.',
                required: true,
                type: 3
            },
            {
                name: 'character-2',
                description: 'Name of character 2.',
                required: true,
                type: 3
            },
            {
                name: 'value',
                description: 'Value in which to change the relationship.',
                required: true,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which relationship should be changed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Add Skill Commnad
    commands?.create({
        name: 'dr-add-skill',
        description: 'Adds skill to list of skills.',
        options:[
            {
                name: 'skill-name',
                description: 'Name of skill to be added.',
                required: true,
                type: 3
            },
            {
                name: 'description',
                description: 'Description of skill.',
                required: true,
                type: 3
            },
            {
                name: 'sp-cost',
                description: 'SP Cost of skill.',
                required: true,
                type: 10
            },
            {
                name: 'prereqs',
                description: 'Prerequisites for the skill. Defaults to none.',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the skill will be added. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Remove Skill Command
    commands?.create({
        name: 'dr-rmv-skill',
        description: 'Removes skill to list of skills.',
        options:[
            {
                name: 'skill-name',
                description: 'Name of skill to be removed.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the skill will be removed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Assign Skill Command
    commands?.create({
        name: 'dr-assign-skill',
        description: 'Assigns skill to list to a character. Unassigns skill if already assigned.',
        options:[
            {
                name: 'skill-name',
                description: 'Name of skill to be assigned/unassigned.',
                required: true,
                type: 3
            },
            {
                name: 'char-name',
                description: 'Name of character to which the skill will be assigned/unassigned.',
                required: true,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the skill will be assigned/unassigned. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View Skills Command
    commands?.create({
        name: 'dr-view-skills',
        description: 'View summary of all skills in current game or skills for a specific character.',
        options:[
            {
                name: 'skill-name',
                description: 'Name of skill to be viewed. Mutually exclusive with \'char-name\' option.',
                required: false,
                type: 3
            },
            {
                name: 'char-name',
                description: 'Name of character to be viewed. Mutually exclusive with \'skill-name\' option.',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which the skills will be viewed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Add TB Command
    commands?.create({
        name: 'dr-add-tb',
        description: 'Adds tb to list of truth bullets.',
        options:[
            {
                name: 'tb-name',
                description: 'Name of tb to be added.',
                required: true,
                type: 3
            },
            {
                name: 'description',
                description: 'Description of tb.',
                required: true,
                type: 3
            },
            {
                name: 'trial',
                description: 'Trial the tb is to be used for. Defaults to -1.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the truth bullet will be added. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Remove TB Command
    commands?.create({
        name: 'dr-rmv-tb',
        description: 'Removes tb to list of truth bullets.',
        options:[
            {
                name: 'tb-name',
                description: 'Name of truth bullet to be removed.',
                required: true,
                type: 3
            },
            {
                name: 'trial',
                description: 'Trial the tb is to be removed for. Defaults to -1.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the truth bullet will be removed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Use TB Command
    commands?.create({
        name: 'dr-use-tb',
        description: 'Uses tb within specified trial (Sets it to active).',
        options:[
            {
                name: 'tb-name',
                description: 'Name of truth bullet to be used.',
                required: true,
                type: 3
            },
            {
                name: 'trial',
                description: 'Trial the tb is to be used for. Defaults to -1.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the truth bullet will be used. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Assign TBs Command
    commands?.create({
        name: 'dr-assign-tb',
        description: 'Assigns tb to a character. Unassigns tb if already assigned.',
        options:[
            {
                name: 'tb-name',
                description: 'Name of tb to be assigned/unassigned.',
                required: true,
                type: 3
            },
            {
                name: 'char-name',
                description: 'Name of character to which the tb will be assigned/unassigned.',
                required: true,
                type: 3
            },
            {
                name: 'trial',
                description: 'Trial for which truth bullet is present to be assigned. Defaults to finding the first tb.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the tb will be assigned/unassigned. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View TBs Command
    commands?.create({
        name: 'dr-view-tbs',
        description: 'View summary of all skills in current game or skills for a specific character.',
        options:[
            {
                name: 'tb-name',
                description: 'Name of skill to be viewed. Mutually exclusive with \'char-name\' option.',
                required: false,
                type: 3
            },
            {
                name: 'char-name',
                description: 'Name of character to be viewed. Mutually exclusive with \'tb-name\' option.',
                required: false,
                type: 3
            },
            {
                name: 'trial',
                description: 'Trial for which truth bullets should be received for. Defaults to all truth bullets.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the tbs will be viewed. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // Modify Inventory Command
    commands?.create({
        name: 'modify-inv',
        description: 'Adds/Removes specific item(s) to a character\'s inventory or updates it\'s quantity.',
        options:[
            {
                name: 'char-name',
                description: 'Name of character whose inventory item should be added/removed.',
                required: true,
                type: 3
            },
            {
                name: 'item-name',
                description: 'Name of the item to be added/removed to the character\'s inventory.',
                required: true,
                type: 3
            },
            {
                name: 'quantity',
                description: 'Positive/Negative quantity of the item to be added/removed to the char\'s inventory. Defauls to 1.',
                required: false,
                type: 10
            },
            {
                name: 'description',
                description: 'Description of item.',
                required: false,
                type: 3
            },
            {
                name: 'weight',
                description: 'Weight of singular item.',
                required: false,
                type: 10
            },
            {
                name: 'game-name',
                description: 'Game for which the item should be added to the char\'s inventory. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    // View Inventory Command
    commands?.create({
        name: 'view-inv',
        description: 'View an inventory or item of a character of a specific name.',
        options: [
            {
                name: 'char-name',
                description: 'Name of character in game.',
                required: true,
                type: 3
            },
            {
                name: 'item-name',
                description: 'Name of the item to be viewed from the character\'s inventory.',
                required: false,
                type: 3
            },
            {
                name: 'game-name',
                description: 'Game for which character\'s inventory should be viewed resides. Defaults to currently active game.',
                required: false,
                type: 3
            }
        ]
    })

    console.log('Bot has completed setup.')
})

client.on(Events.InteractionCreate, async (interaction) => {
    if(!interaction.isChatInputCommand()){
        return
    }

    ActiveGame.createTable(gamedb)

    const guildID = '1032153970254282753'

    const { commandName, options } = interaction
    const userId = interaction.user.id

    const gameName = options.getString('game-name')?.trim().replace(/ /g, '_')

    let activeGame = await ActiveGame.getCurrentGame(gamedb, 'GamesDB', guildID, gameName)
            
    const tableNameBase = `${guildID}_${activeGame?.gameName == null? gameName : activeGame?.gameName}`;

    if(commandName === 'create-game'){

        const gameType = options.getString('game-type')
        let DM = options.getUser('dm-name')?.id

        if(DM == null){
            DM = userId
        }

        let newGame = new ActiveGame(guildID, String(gameName), gameType, DM, true)

        newGame.addToTable(gamedb)
        
        let additionalStats = Character.parseColumns(String(options.getString('additional-stats')))

        if(additionalStats == undefined){
            interaction.reply({
                content: 'Issue parsing additional columns.'
            })
            return
        }

        Character.createTable(gamedb, tableNameBase, additionalStats)
        Inventory.createTable(gamedb, tableNameBase)

        if(gameType === 'dr'){ // Danganronpa TTRPG Game
            DRCharacter.createTable(gamedb, tableNameBase)

            DRSkill.createTables(gamedb, tableNameBase)

            DRTruthBullet.createTables(gamedb, tableNameBase)

            DRRelationship.createTable(gamedb, tableNameBase)

        } else if(gameType === 'pkm'){ // Pokemon TTRPG Game
            interaction.reply({
                content: 'PokeTTRPG has not been implemented yet.'
            })
            return
        } else if(gameType === 'dnd'){ // Dungeons and Dragons Game
            interaction.reply({
                content: 'DnD has not been implemented yet.'
            })
            return   
        }

        interaction.reply({
            content: 'The game ' + '**\"' + gameName + '\"** has been successfully created.'
        })
    } else if(commandName === 'add-chr'){

        const charName = options.getString('chr-name', true)
        const chrUser = options.getUser('chr-owner')
        const stats = options.getString('additional-stats')
        let chrId

        if(chrUser == null){
            chrId = userId
        }else{
            chrId = String(chrUser.id)
        }

        let additionalStats

        additionalStats = Character.parseColumns(stats)

        if(additionalStats == undefined){
            interaction.reply({
                content: 'Issue parsing additional columns.'
            })
            return
        }

        let newChar = new Character(charName, 
                                    UtilityFunctions.getEmojiID(options.getString('emote')),
                                    options.getString('pronouns'),
                                    chrId,
                                    options.getNumber('health'),
                                    0,
                                    additionalStats);
        newChar.addToTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    }
    else if(commandName === 'dr-add-chr'){

        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot add dr character to non-dr game.'
            })
            return
        }

        const charName = options.getString('chr-name', true)
        const chrUser = options.getUser('chr-owner')
        let chrId

        if(chrUser == null){
            chrId = userId
        }else{
            chrId = String(chrUser.id)
        }

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

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully created.'
        })
    } else if(commandName === 'rmv-chr'){
        const charName = options.getString('chr-name', true)

        let tbdChar
        if(activeGame?.gameType === 'dr'){
            tbdChar = await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
        }else{
            tbdChar = new Character(charName, null, null, '', -1, -1, [])
        }

        tbdChar?.removeFromTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully deleted.'
        })
    } else if(commandName === 'view-chr'){

        const charName = options.getString('chr-name', true)
        const user = interaction.user
        const guild = interaction.guild
        let char : Character | null

        if(activeGame?.gameType === 'dr'){
            char = await DRCharacter.getCharacter(gamedb, tableNameBase, charName)
        }else{
            char = await Character.getCharacter(gamedb, tableNameBase, charName)
        }

        if(char == null){
            interaction.reply({
                content: 'Finding character ' + '**\"' + charName + '\"** was unsuccessful.'
            })
            return
        }

        interaction.channel?.send({embeds : [char.buildViewEmbed(user, guild)] });

        interaction.reply({
            content: 'The character ' + '**\"' + charName + '\"** has been successfully viewed.'
        })
    } else if(commandName === 'roll'){
        const query = options.getString('query', true)
        let identifier = options.getString('identifier')

        if(identifier == null){
            identifier = 'Result'
        }

        identifier += ': '

        const result = UtilityFunctions.parseRoll(query)
        
        interaction.reply({content: `${interaction.user} :game_die:\n**${identifier}** ${result?.[0]}\n**Total:** ${result?.[1]}`})
    } else if(commandName === 'change-stat'){

        const charName = options.getString('chr-name', true)
        const statName = options.getString('stat-name', true)
        const statValue = options.getString('stat-value', true)
        
        let tbdChar = new Character(charName, null, null, '', -1, -1, []);
        if(!tbdChar.updateStat(gamedb, tableNameBase, statName, statValue)){
            interaction.reply({
                content: 'Cannot update the Name column of a character. Instead please remove the character and replace them with a new one.'
            })
            return 
        }

        interaction.reply({
            content: `The character stat **\"${statName}\"** for **\"${charName}\"** has successfully been changed to **\"${statValue}\"**.`
        })
    } else if(commandName === 'set-dm'){
        const newDM = options.getUser('newdm-name', true)

        if(activeGame == null){
            interaction.reply({
                content: 'Issue retrieving active game.'
            })
            return
        }
        const guild = client.guilds.cache.get(guildID)
        let oldDM = guild?.members.cache.get(activeGame.DM)

        activeGame.DM = newDM.id
        activeGame.setDM(gamedb)

        interaction.reply({
            content: `DM successfully changed to from ${oldDM} to ${newDM}`
        })
    } else if(commandName === 'change-game'){

        let newGame = new ActiveGame(guildID, String(gameName), '', userId, true)

        newGame.changeGame(gamedb)

        interaction.reply({
            content: `Game successfully changed to **\"${gameName}\"**`
        })
    } else if(commandName === 'view-summary'){
        
        if(activeGame == null){
            interaction.reply({
                content: 'Issue retrieving active game.'
            })
            return
        }

        let embed = Character.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, await Character.getAllCharacters(gamedb, tableNameBase))

        if(embed == null){
            interaction.reply({
                content: 'Error finding all characters and building embed.'
            })
            return
        }

        interaction.channel?.send({embeds : [embed] });

        interaction.reply({
            content: 'The characters in ' + '**\"' + activeGame.gameName + '\"** has been successfully viewed.'
        })
        
    } else if(commandName === 'dr-view-relationship'){
        const charName1 = options.getString('character-1', true)
        const charName2 = options.getString('character-2', true)

        let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

        if(char1 == null){
            interaction.reply({
                content: 'Error obtaining character 1.'
            })
            return
        } else if(char2 == null){
            interaction.reply({
                content: 'Error obtaining character 2.'
            })
            return
        }

        let relationship = await new DRRelationship(char1, char2).getRelationship(gamedb, tableNameBase)

        if(relationship == null){
            interaction.reply({
                content: 'Error obtaining relationship.'
            })
            return
        }

        interaction.channel?.send({embeds : [relationship.buildViewEmbed(interaction.user, interaction.guild)] });

        interaction.reply({
            content: `${charName1} and ${charName2}'s relationship has been successfully viewed`
        })
    } else if(commandName === 'dr-change-relationship'){

        const charName1 = options.getString('character-1', true)
        const charName2 = options.getString('character-2', true)
        const value = options.getNumber('value', true)

        let char1 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName1)
        let char2 = await DRCharacter.getCharacter(gamedb, tableNameBase, charName2)

        if(char1 == null){
            interaction.reply({
                content: 'Error obtaining character 1.'
            })
            return
        } else if(char2 == null){
            interaction.reply({
                content: 'Error obtaining character 2.'
            })
            return
        }

        let relationship = new DRRelationship(char1, char2)

        relationship.changeRelationship(gamedb, tableNameBase, value)

        interaction.reply({
            content: `${charName1} and ${charName2}'s relationship has been successfully updated to ${value}`
        })
    } else if(commandName === 'dr-add-skill'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot add dr skill in non-dr game.'
            })
            return
        }

        const skillName = options.getString('skill-name', true)

        let newSkill = new DRSkill(skillName,
                                    options.getString('prereqs'),
                                    options.getString('description', true),
                                    options.getNumber('sp-cost', true))

        newSkill.addToTable(gamedb, tableNameBase)

        interaction.reply({
            content: 'The skill ' + '**\"' + skillName + '\"** has been successfully created.'
        })
    } else if(commandName === 'dr-rmv-skill'){ //can probably consolidate this and add skill into one command with how similar they are
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot remove dr skill in non-dr game.'
            })
            return
        }

        const skillName = options.getString('skill-name', true)

        let tbdSkill = new DRSkill(skillName, '', '', -1)

        tbdSkill.removeFromTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The skill ' + '**\"' + skillName + '\"** has been successfully removed.'
        })
    } else if(commandName === 'dr-assign-skill'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot assign dr skill in non-dr game.'
            })
            return
        }

        const chrName = options.getString('char-name', true)
        const skillName = options.getString('skill-name', true)

        const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
        const skill = await DRSkill.getSkill(gamedb, tableNameBase, skillName)

        if(chr == null){
            interaction.reply({
                content: `Error finding character ${chrName}.`
            })
            return
        } 
        
        if (skill == null){
            interaction.reply({
                content: `Error finding skill ${skillName}.`
            })
            return
        }

        let newChrSkill = new DRChrSkills(chr.id, skill.id)

        let exists = await newChrSkill.ifExists(gamedb, tableNameBase)

        if(exists == null){
            interaction.reply({
                content: `Error checking if ChrSkill exists.`
            })
        }else if(exists){
            newChrSkill.removeFromTable(gamedb, tableNameBase)

            interaction.reply({
                content: `Removed skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
            })
        }else{
            newChrSkill.addToTable(gamedb, tableNameBase)

            interaction.reply({
                content: `Added skill **\"${skillName}\"** to character **\"${chrName}\"** successfully.`
            })
        }
    } else if(commandName === 'dr-view-skills'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot view dr skill in non-dr game.'
            })
            return
        }

        const chrName = options.getString('char-name')
        const skillName = options.getString('skill-name')

        if(chrName != null && skillName != null){
            interaction.reply({
                content: 'Must choose either Skill summary or Character Skill summary, not both.'
            })
            return
        } else if(chrName != null){
            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)

            if(chr == null){
                interaction.reply({
                    content: `Error finding character ${chrName}.`
                })
                return
            } 

            const chrSkills = await chr.getAllChrSkills(gamedb, tableNameBase)

            const embedBuilder = chr.buildSkillEmbed(interaction.user, interaction.guild, chrSkills)

            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });

            interaction.reply({
                content: `**${chrName}'s** skills has been successfully viewed.`
            })
        } else if(skillName != null){
            const skill = await DRSkill.getSkill(gamedb, tableNameBase, skillName)

            if(skill == null){
                interaction.reply({
                    content: `Error finding skill ${skillName}.`
                })
                return
            } 
            
            interaction.channel?.send({embeds : [skill.buildViewEmbed(interaction.user, interaction.guild, activeGame)] });

            interaction.reply({
                content: `Skill **\"${skillName}\"** has been successfully viewed`
            })
        } else{
            const allSkills = await DRSkill.getAllSkills(gamedb, tableNameBase)

            const embedBuilder = DRSkill.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, allSkills)

            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });

            interaction.reply({
                content: `All skills have been successfully viewed`
            })
        }
    }else if(commandName === 'dr-add-tb'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot add dr tb in non-dr game.'
            })
            return
        }

        const tbName = options.getString('tb-name', true)

        let newTB = new DRTruthBullet(tbName,
                                    options.getString('description', true),
                                    options.getNumber('trial'),
                                    false)

        newTB.addToTable(gamedb, tableNameBase)

        interaction.reply({
            content: 'The truth bullet ' + '**\"' + tbName + '\"** has been successfully created.'
        })
    } else if(commandName === 'dr-rmv-tb'){ //can probably consolidate this and add skill into one command with how similar they are
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot remove dr tb in non-dr game.'
            })
            return
        }

        const tbName = options.getString('tb-name', true)

        let tbdTB = new DRTruthBullet(tbName, '', options.getNumber('trial'), false)

        tbdTB.removeFromTable(gamedb, tableNameBase)    

        interaction.reply({
            content: 'The skill ' + '**\"' + tbName + '\"** has been successfully removed.'
        })
    } else if(commandName === 'dr-assign-tb'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot assign dr tb in non-dr game.'
            })
            return
        }

        const chrName = options.getString('char-name', true)
        const tbName = options.getString('tb-name', true)

        const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)
        const tb = await DRTruthBullet.getTB(gamedb, tableNameBase, tbName, options.getNumber('trial'))

        if(chr == null){
            interaction.reply({
                content: `Error finding character ${chrName}.`
            })
            return
        } 
        
        if (tb == null){
            interaction.reply({
                content: `Error finding truth bullet ${tbName}.`
            })
            return
        }

        let newChrTB = new DRChrTBs(chr.id, tb.id)

        let exists = await newChrTB.ifExists(gamedb, tableNameBase)

        if(exists == null){
            interaction.reply({
                content: `Error checking if ChrTB exists.`
            })
        }else if(exists){
            newChrTB.removeFromTable(gamedb, tableNameBase)

            interaction.reply({
                content: `Removed truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
            })
        }else{
            newChrTB.addToTable(gamedb, tableNameBase)

            interaction.reply({
                content: `Added truth bullet **\"${tbName}\"** to character **\"${chrName}\"** successfully.`
            })
        }
    } else if(commandName === 'dr-view-tbs'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot view dr tbs in non-dr game.'
            })
            return
        }

        const chrName = options.getString('char-name')
        const tbName = options.getString('tb-name')
        const trialNum = options.getNumber('trial')

        if(chrName != null && tbName != null){
            interaction.reply({
                content: 'Must choose either Truth Bullet summary or Character Truth Bullet summary, not both.'
            })
            return
        } else if(chrName != null){
            const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)

            if(chr == null){
                interaction.reply({
                    content: `Error finding character ${chrName}.`
                })
                return
            } 

            const chrSkills = await chr.getAllChrTBs(gamedb, tableNameBase, trialNum)

            const embedBuilder = chr.buildTBEmbed(interaction.user, interaction.guild, chrSkills)

            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });

            interaction.reply({
                content: `**${chrName}'s** truth bullets has been successfully viewed.`
            })
        } else if(tbName != null){
            const tb = await DRTruthBullet.getTB(gamedb, tableNameBase, tbName, trialNum)

            if(tb == null){
                interaction.reply({
                    content: `Error finding truth bullet ${tbName}.`
                })
                return
            } 
            
            interaction.channel?.send({embeds : [tb.buildViewEmbed(interaction.user, interaction.guild, activeGame)] });

            interaction.reply({
                content: `Truth Bullet **\"${tbName}\"** has been successfully viewed.`
            })
        } else{
            const allTBs = await DRTruthBullet.getAllTBs(gamedb, tableNameBase, trialNum)

            const embedBuilder = DRTruthBullet.buildSummaryEmbed(interaction.user, interaction.guild, activeGame, allTBs)

            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });

            interaction.reply({
                content: `All truth bullets have been successfully viewed.`
            })
        } 
    } else if(commandName === 'dr-use-tb'){
        if(activeGame?.gameType !== 'dr'){
            interaction.reply({
                content: 'Cannot use dr tb in non-dr game.'
            })
            return
        }

        const tbName = options.getString('tb-name', true)

        
        let tbuTB = new DRTruthBullet(tbName,
            '',
            options.getNumber('trial'),
            false)

        tbuTB.useTB(gamedb, tableNameBase)

        interaction.reply({
            content: `Truth bullet **\"${tbName}\"** has been successfully usage toggled.`
        })
    } else if(commandName === 'modify-inv'){
        const chrName = options.getString('char-name', true)

        const chr = await DRCharacter.getCharacter(gamedb, tableNameBase, chrName)

        if(chr == null){
            interaction.reply({
                content: `Error finding character ${chrName}.`
            })
            return
        } 

        const item = options.getString('item-name', true)
        const quant = options.getNumber('quantity')
        const desc = options.getString('description')
        const weight = options.getNumber('weight')

        const inv = await Inventory.getItem(gamedb, tableNameBase, chr.id, item)

        if(inv == null){
            interaction.reply({
                content: `Error retrieving item ${item} in inventory for ${chrName}.`
            })
            return
        } 

        //If doesn't exist, then add new item to inventory
        //If does exist, change quantity (Remove if quantity results in less than 0)

        if(inv == false || inv == true){
            let newChrInv = new Inventory(chr.id, item, quant, desc, weight)

            if(newChrInv.quantity <= 0){
                interaction.reply({
                    content: `Error: Cannot add item ${item} with nonpositive quantity (${quant}).`
                })
                return
            }

            newChrInv.addToTable(gamedb, tableNameBase)

            interaction.reply({
                content: `Character **${chrName}'s** inventory has been successfully updated to add **${newChrInv.quantity}** of **\"${item}\"**.`
            })
        } else{
            const newQuant = inv.quantity + (quant == null ? 1: quant);

            if(newQuant <= 0){
                inv.removeFromTable(gamedb, tableNameBase)

                interaction.reply({
                    content: `Character **${chrName}'s** inventory has been successfully updated to remove item **\"${item}\"**.`
                })
            }else{
                inv.updateItem(gamedb, tableNameBase, newQuant, weight, desc)

                interaction.reply({
                    content: `Character **${chrName}\'s** inventory has been successfully updated to possess **${newQuant}** of **\"${item}\"**.`
                })
            }
        }
    } else if(commandName == 'view-inv'){
        const chrName = options.getString('char-name', true)

        const chr = await Character.getCharacter(gamedb, tableNameBase, chrName)

        if(chr == null){
            interaction.reply({
                content: `Error finding character ${chrName}.`
            })
            return
        } 

        const itemName = options.getString('item-name')

        if(itemName == null){
            const chrItems = await chr.getAllChrItems(gamedb, tableNameBase)

            const embedBuilder = chr.buildInventoryEmbed(interaction.user, interaction.guild, chrItems)
    
            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });
    
            interaction.reply({
                content: `**${chrName}'s** inventory has been successfully viewed.`
            })
        }else{
            if(activeGame == null){
                interaction.reply({
                    content: 'Issue retrieving active game.'
                })
                return
            }

            const item = await Inventory.getItem(gamedb, tableNameBase, chr.id, itemName)

            if(item == null){
                interaction.reply({
                    content: `Error retrieving item.`
                })
                return
            } else if(item == false || item == true){
                interaction.reply({
                    content: `Item does not exist.`
                })
                return
            }

            const embedBuilder = item.buildViewEmbed(interaction.user, interaction.guild, activeGame)
    
            if(embedBuilder == null){
                interaction.reply({
                    content: `Error building embed.`
                })
                return
            }
            
            interaction.channel?.send({embeds : [embedBuilder] });
    
            interaction.reply({
                content: `**${chrName}'s** item **${itemName}** has been successfully viewed.`
            })
        }
    }
})

client.login(process.env.TOKEN)
