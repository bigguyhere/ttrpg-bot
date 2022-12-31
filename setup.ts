import { Client, Guild, GuildApplicationCommandManager } from "discord.js"

module SetupFunctions{
    export function commandSetup(guild: Guild | undefined, client: Client<boolean>) : void {
    
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
    }
}

export{SetupFunctions}