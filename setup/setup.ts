import { ApplicationCommandOptionType, Client, Guild } from "discord.js"
import { CustomSetup } from "./custom_setup"

module SetupFunctions{
    export function commandSetup(testGuild: Guild | undefined, client: Client<boolean>) : void {
    
        let commands

        if(testGuild){
            commands = testGuild.commands;
        } else{
            commands = client.application?.commands;
        }

        //commands?.set([]);

        // Game Commands
        commands?.create({
            name: 'game',
            description: 'Faciliates the changing/creating of games.',
            options: [
                {
                    name: 'create',
                    description: 'Creates game',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'game-name',
                            description: 'Name of the TTRPG to be created.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'dm-name',
                            description: 'User who will be the DM of the created game. Defaults to user who set command.',
                            required: false,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'game-type',
                            description: 'Load Predefined TTRPG (Currently Implemented: DR).',
                            required: false,
                            type: ApplicationCommandOptionType.String,
                            choices: [
                                {name: 'DanganronpaTTRPG', value: 'dr'},
                                {name: 'PokemanzTTRPG', value: 'pkm'},
                                {name: 'Other', value: ''}
                            ]
                        },
                        {
                            name: 'additional-stats',
                            description: 'Entered in form of "[Stat-Name-1]|[Data-Type],[Stat-Name-2],...". [Data-Type] is optional.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'change',
                    description: 'Changes active game on server.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'game-name',
                            description: 'Name of the new active game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'set-dm',
                    description: 'Changes DM for a given game.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'newdm-name',
                            description: 'User who will be the new DM of the specified.',
                            required: true,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which DM will be changed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view-summary',
                    description: "View Summary of all characters in currently active game.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'is-hidden',
                            description: 'Makes response hidden from rest of the channel (ephemeral). Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which summary should be found for. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'help',
                    description: "Lists all commands if command name is not supplied. Otherwise lists command and it's parameters.",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'command-name',
                            description: 'Name of command to be retrieved.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'is-hidden',
                            description: 'Makes response hidden from rest of the channel (ephemeral). Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        }
                    ]
                }
            ]
        })
        
        // Character Commands
        commands?.create({
            name: 'character',
            description: 'Facilitates character management.',
            options: [
                {
                    name: 'add',
                    description: 'Adds a character to the game.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'emote',
                            description: 'Emote of character to be displayed. Must be an emote on this server.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'pronouns',
                            description: 'Pronouns to use by bot (Separate [P1]/[P2]). Defaults to They/Them.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-owner',
                            description: 'User who owns the character, defaults to the user who executed the command.',
                            required: false,
                            type: ApplicationCommandOptionType.User
                        },
                        {
                            name: 'health',
                            description: 'Numerical value for health.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'status',
                            description: 'Status of a character (i.e. Scared, Burned).',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'additional-stats',
                            description: 'Additional stats to be added. Format in "[Stat-Name-1]|[Value-1],[Stat-Name-2]|[Value-2],...".',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character should be added. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes character from the game.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character should be removed resides. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'change-stat',
                    description: 'Changes stat of a character.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character whose stat should be changed.',
                            required:true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'stat-name',
                            description: 'Name of stat to be changed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'stat-value',
                            description: 'Value of stat to be changed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'increment',
                            description: 'True if incrementing/decrementing number, false otherwise. Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game where character\'s stats will be changed resides. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view',
                    description: 'View a character of a specific name.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'is-hidden',
                            description: 'Makes response hidden from rest of the channel (ephemeral). Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character should be viewed resides. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
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
                    description: 'Query for dice roll. Should be in the form of **[Number]**d**[Sides of Dice]** +/- **[Modifier]**',
                    required: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'identifier',
                    description: 'Replace "Result:" in roll with identifier.',
                    required: false,
                    type: ApplicationCommandOptionType.String
                }
            ]
        })

        // Inventory Commands
        commands?.create({
            name: 'inventory',
            description: 'Facilitates inventory management.',
            options: [
                {
                    name: 'modify',
                    description: 'Adds/Removes specific item(s) to a character\'s inventory or updates it\'s quantity.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'char-name',
                            description: 'Name of character whose inventory item should be added/removed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'item-name',
                            description: 'Name of the item to be added/removed to the character\'s inventory.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'quantity',
                            description: 'Positive/Negative quantity of the item to be added/removed to the char\'s inventory. Defauls to 1.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'description',
                            description: 'Description of item.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'weight',
                            description: 'Weight of singular item.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the item should be added to the char\'s inventory. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view',
                    description: 'View an inventory or item of a character of a specific name.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'item-name',
                            description: 'Name of the item to be viewed from the character\'s inventory.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'is-hidden',
                            description: 'Makes response hidden from rest of the channel (ephemeral). Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character\'s inventory should be viewed resides. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        })

        // Initiative Commands
        commands?.create({
            name: 'init',
            description: 'Facilitates initiative tracking.',
            options: [
                {
                    name: 'begin',
                    description: 'Begins initiative.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'roll',
                            description: 'Dice (XdY) used as default die for rolling initative. Defaults to 1d20.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'hide-hp',
                            description: 'True to hide HP values from initiative. Cannot be changed. Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which initiative will begin. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'end',
                    description: 'Ends initiative.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'game-name',
                            description: 'Game for which initiative will be ended. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'next',
                    description: 'Starts or continues to the next turn of initiative.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'game-name',
                            description: 'Game for which initiative will proceed to next turn. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'add',
                    description: 'Adds character to initiative. Will autofill if character already exists.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character to be added to initiative.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'emote',
                            description: 'Emote to be displayed upon your turn. Can autofill.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'hp',
                            description: 'Health of the character to be added to initiative. Can autofill.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'query',
                            description: 'Overrides default die roll. Defaults to 1d20.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'quantity',
                            description: 'Quantity of characters to be added. Defaults to 1.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character will be added to initiative. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes character from initiative.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character to be removed from initiative.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character will be removed from initiative. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'set-active',
                    description: 'Changes active character in initiative.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character to make their turn.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which active character is changed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'hp',
                    description: 'Changes Initative and/or Character HP.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character who will be taking damage.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'value',
                            description: 'Positive value for damage taken.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'init-only',
                            description: 'True if only want to change initative health for a character. Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which HP will be changed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }

            ]
        })

        CustomSetup.setup(commands)
    }
}

export{SetupFunctions}