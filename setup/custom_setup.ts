import { ApplicationCommand, ApplicationCommandManager, ApplicationCommandOptionType, ApplicationCommandType, GuildApplicationCommandManager, GuildResolvable, InteractionType } from "discord.js";

module CustomSetup{
    export function setup(commands: GuildApplicationCommandManager |
    ApplicationCommandManager<ApplicationCommand<
    {guild: GuildResolvable;}>, {guild: GuildResolvable;}, null> 
    | undefined) : void {

        // DR Character Commands
        commands?.create({
            name: 'dr-character',
            description: 'Facilitates DR character management.',
            options: [
                {
                    name: 'add',
                    description: 'Adds a DR character to a DR game.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character in game.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'brains',
                            description: 'Brains stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'brawn',
                            description: 'Brawn stat value. Also determines Stamina.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'nimble',
                            description: 'Nimble stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'social',
                            description: 'Social stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'intuition',
                            description: 'Intuition stat value.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
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
                            name: 'ult-talent',
                            description: 'Character\'s ultimate talent.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character should be added to. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view-hd',
                    description: 'Allows player to view their hope and despair secrety.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Character whose hope/despair will be viewed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character\'s hope/despair will be viewed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        })

        // Relationship Commands
        commands?.create({
            name: 'dr-relationship',
            description: 'Facilitates DR relationships.',
            options: [
                {
                    name: 'view',
                    description: 'View relationship between two characters',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'character-1',
                            description: 'Name of character 1.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'character-2',
                            description: 'Name of character 2.',
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
                            description: 'Game for which the relationship should be viewed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'change',
                    description: 'Change relationship between two characters',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'character-1',
                            description: 'Name of character 1.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'character-2',
                            description: 'Name of character 2.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'value',
                            description: 'Value in which to set the relationship to. DOES NOT ADD/SUBTRACT FROM CURRENT ONE.',
                            required: true,
                            type: ApplicationCommandOptionType.Number,
                            choices: [
                                {name: 'Close Friends (+2)', value: 2},
                                {name: 'Friends (+1)', value: 1},
                                {name: 'Acquaintances (0)', value: 0},
                                {name: 'Annoyance (-1)', value: -1},
                                {name: 'Enemy (-2)', value: -2}
                            ] 
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which relationship should be changed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        })

        // Skill Commands
        commands?.create({
            name: 'dr-skill',
            description: 'Facilitates DR relationships.',
            options: [
                {
                    name: 'add',
                    description: 'Adds skill to list of skills.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'skill-name',
                            description: 'Name of skill to be added.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'description',
                            description: 'Description of skill.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'sp-cost',
                            description: 'SP Cost of skill.',
                            required: true,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'prereqs',
                            description: 'Prerequisites for the skill. Defaults to none.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'type',
                            description: 'Type of skill (General, Private, Public). Defaults to Private.',
                            required: false,
                            type: ApplicationCommandOptionType.String,
                            choices: [
                                {name: 'Private', value: 'PRV'},
                                {name: 'General', value: 'GEN'},
                                {name: 'Public', value: 'PUB'}
                            ]
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the skill will be added. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes skill to list of skills.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'skill-name',
                            description: 'Name of skill to be removed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the skill will be removed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'assign',
                    description: 'Assigns skill to list to a character. Unassigns skill if already assigned.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'skill-name',
                            description: 'Name of skill to be assigned/unassigned.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-name',
                            description: 'Name of character to which the skill will be assigned/unassigned.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the skill will be assigned/unassigned. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view',
                    description: 'View summary of all skills in current game or skills for a specific character.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'skill-name',
                            description: 'Name of skill to be viewed. Mutually exclusive with \'char-name\' option.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-name',
                            description: 'Name of character to be viewed. Mutually exclusive with \'skill-name\' option.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'is-dynamic',
                            description: 'Controls whether dynamic view is shown or not. Defaults to false for summary, true for char-name.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'is-hidden',
                            description: 'Makes response hidden from rest of the channel (ephemeral). Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the skills will be viewed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        })

        // Truth Bullet Commands
        commands?.create({
            name: 'dr-tb',
            description: 'Facilitates truth bullet management.',
            options: [
                {
                    name: 'add',
                    description: 'Adds tb to list of truth bullets.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'tb-name',
                            description: 'Name of tb to be added.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'description',
                            description: 'Description of tb.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'trial',
                            description: 'Trial the tb is to be used for. Defaults to -1.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'assign-all',
                            description: 'Assigns all alive characters in the Character table this truth bullet. Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the truth bullet will be added. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'remove',
                    description: 'Removes tb to list of truth bullets.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'tb-name',
                            description: 'Name of truth bullet to be removed.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'trial',
                            description: 'Trial the tb is to be removed for. Defaults to -1.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the truth bullet will be removed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'use',
                    description: 'Uses tb within specified trial (Sets it to active).',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'tb-name',
                            description: 'Name of truth bullet to be used.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'trial',
                            description: 'Trial the tb is to be used for. Defaults to -1.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the truth bullet will be used. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'assign',
                    description: 'Assigns tb to a character. Unassigns tb if already assigned.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'tb-name',
                            description: 'Name of tb to be assigned/unassigned.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-name',
                            description: 'Name of character to which the tb will be assigned/unassigned.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'trial',
                            description: 'Trial for which truth bullet is present to be assigned. Defaults to finding the first tb.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the tb will be assigned/unassigned. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'view',
                    description: 'View summary of all skills in current game or skills for a specific character.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options:[
                        {
                            name: 'tb-name',
                            description: 'Name of skill to be viewed. Mutually exclusive with \'char-name\' option.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'char-name',
                            description: 'Name of character to be viewed. Mutually exclusive with \'tb-name\' option.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'trial',
                            description: 'Trial for which truth bullets should be received for. Defaults to all truth bullets.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        },
                        {
                            name: 'is-dynamic',
                            description: 'Controls whether dynamic view is shown or not. Defaults to false for summary, true for char-name.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which the tbs will be viewed. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.Number
                        }
                    ]
                }
            ]
        })
        
        // Trial Commands
        commands?.create({
            name: 'dr-trial',
            description: 'Facilitates class trial management.',
            options: [
                {
                    name: 'begin',
                    description: 'Begins class trial.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'blackened',
                            description: 'Name of character who is the blackened.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'victims',
                            description: 'Names of the victim(s) who are murdered. Multiple format: Victim1|Victim2|VictimN',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'add-all',
                            description: 'Adds all alive characters in the Character table to the trial. Defaults to false.',
                            required: false,
                            type: ApplicationCommandOptionType.Boolean
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which trial will begin in. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'end',
                    description: 'Ends class trial.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'cs-char1',
                            description: 'First character doing the case summary.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'cs-char2',
                            description: 'Second character doing the case summary.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which trial will be ended in. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'add-character',
                    description: 'Adds character to trial. Will autofill if character already exists.',
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
                            name: 'query',
                            description: 'Overrides default die roll. Defaults to 2d6 + Brains.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which character will be added to the trial. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'vote',
                    description: 'Vote for who the blackened is during a class trial.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'voter-char',
                            description: 'Name of the character who is voting',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'vote',
                            description: 'Name of character who is being voted as the blackened.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which vote will be cast. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'hangman',
                    description: 'Initiates the Hangman\'s Gambit minigame.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Name of character whose owner will receive the scrambled word DM.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'word',
                            description: 'Word that will be scrambled.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which hangman\'s gambit will take place. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                },
                {
                    name: 'interrupt',
                    description: 'Facilitates interruptions (consent/counter/rebuttal) during a trial.',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: 'char-name',
                            description: 'Character who is interrupting the non-stop debate.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'tb-name',
                            description: 'Name of the truth bullet used to interrupt.',
                            required: true,
                            type: ApplicationCommandOptionType.String
                        },
                        {
                            name: 'type',
                            description: 'Type of interruption (counter/consent/rebuttal).',
                            required: false,
                            type: ApplicationCommandOptionType.Number,
                            choices: [
                                {name: 'Consent', value: 0},
                                {name: 'Counter', value: 1},
                                {name: 'Rebuttal', value: 2}
                            ] 
                        },
                        {
                            name: 'game-name',
                            description: 'Game for which trial will be interrupted. Defaults to currently active game.',
                            required: false,
                            type: ApplicationCommandOptionType.String
                        }
                    ]
                }
            ]
        })

        // Body Discovery Command
        commands?.create({
            name: 'dr-body-discovery',
            description: 'Facilitates discovering a body.',
            options: [
                {
                    name: 'discoverers',
                    description: 'Character(s) who discovered the body. Multiple format: Disc1|Disc2|DiscN',
                    required: true,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'witnesses',
                    description: 'Character(s) who witnessed the murder. Multiple format: Wit1|Wit2|WitN',
                    required: false,
                    type: ApplicationCommandOptionType.String
                },
                {
                    name: 'game-name',
                    description: 'Game for which body will be discovered. Defaults to currently active game.',
                    required: false,
                    type: ApplicationCommandOptionType.String
                }
            ]
        })
    }
}

export{CustomSetup}