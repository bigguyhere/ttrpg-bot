import { ApplicationCommand, ApplicationCommandManager, GuildApplicationCommandManager, GuildResolvable } from "discord.js";
import { createPool } from "mysql";

module CustomSetup{
    export function setup(commands: GuildApplicationCommandManager |
    ApplicationCommandManager<ApplicationCommand<
    {guild: GuildResolvable;}>, {guild: GuildResolvable;}, null> 
    | undefined) : void {

        // Add DR Character Command
        commands?.create({
            name: 'dr-add-chr',
            description: 'Adds a DR character to a DR game.',
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
            description: 'Change relationship between two characters',
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
                    description: 'Value in which to set the relationship to. DOES NOT ADD/SUBTRACT FROM CURRENT ONE.',
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

        commands?.create({
            name: 'dr-begin-trial',
            description: 'Begins class trial.',
            options: [
                {
                    name: 'blackened',
                    description: 'Name of character who is the blackened.',
                    required: true,
                    type: 3
                },
                {
                    name: 'victims',
                    description: 'Names of the victim(s) who are murdered. Multiple format: Victim1|Victim2|VictimN',
                    required: true,
                    type: 3
                },
                {
                    name: 'initial-topic',
                    description: 'Initial topic of discussion for the trial.',
                    required: false,
                    type: 3
                }
            ]
            
        })

        commands?.create({
            name: 'dr-end-trial',
            description: 'Ends class trial.',
            options: [
                {
                    name: 'cs-char1',
                    description: 'First character doing the case summary.',
                    required: false,
                    type: 3
                },
                {
                    name: 'cs-char2',
                    description: 'Second character doing the case summary.',
                    required: false,
                    type: 3
                }
            ]
        })

        commands?.create({
            name: 'dr-add-trial',
            description: 'Adds character to trial. Will autofill if character already exists.',
            options: [
                {
                    name: 'char-name',
                    description: 'Name of character to be added to initiative.',
                    required: true,
                    type: 3
                },
                {
                    name: 'emote',
                    description: 'Emote to be displayed upon your turn. Can autofill.',
                    required: false,
                    type: 3
                },
                {
                    name: 'query',
                    description: 'Overrides default die roll. Defaults to 2d6 + Brains.',
                    required: false,
                    type: 3
                }
            ]
        })

        commands?.create({
            name: 'dr-vote',
            description: 'Vote for who the blackened is during a class trial.',
            options: [
                {
                    name: 'voter-chr',
                    description: 'Name of the character who is voting',
                    required: true,
                    type: 3
                },
                {
                    name: 'vote',
                    description: 'Name of character who is being voted as the blackened.',
                    required: true,
                    type: 3
                }
            ]
        })

        commands?.create({
            name: 'dr-topic',
            description: 'Generates a new topic for discussion during a trial',
            options: [
                {
                    name: 'new-topic',
                    description: 'New topic of discussion for trial.',
                    required: true,
                    type: 3
                },
                {
                    name: 'char-name',
                    description: 'Character who is changing topic of discussion.',
                    required: false,
                    type: 3
                }
            ]
        })

        commands?.create({
            name: 'dr-hangman',
            description: 'Initiates the Hangman\'s Gambit minigame.',
            options: [
                {
                    name: 'char-name',
                    description: 'Name of character whose owner will receive the scrambled word DM.',
                    required: true,
                    type: 3
                },
                {
                    name: 'word',
                    description: 'Word that will be scrambled.',
                    required: true,
                    type: 3
                }
            ]
        })

        commands?.create({
            name: 'dr-interrupt',
            description: 'Facilitates interruptions (consent/counter/rebuttal) during a trial.',
            options: [
                {
                    name: 'char-name',
                    description: 'Character who is interrupting the non-stop debate.',
                    required: true,
                    type: 3
                },
                {
                    name: 'tb-name',
                    description: 'Name of the truth bullet used to interrupt.',
                    required: true,
                    type: 3
                },
                {
                    name: 'type',
                    description: 'Type of interruption (counter/consent/rebuttal).',
                    required: false,
                    type: 3
                }
            ]
        })
    }
}

export{CustomSetup}