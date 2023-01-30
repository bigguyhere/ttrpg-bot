import { CacheType, ChatInputCommandInteraction, Client, CommandInteractionOptionResolver, GuildMember} from "discord.js";
import { Connection } from "mysql";
import { ActiveGame } from "../../../models/activegame";
import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter";
import { DRRelationship } from "../../../models/custommodels/drmodels/drrelationship";
import { DRSkill } from "../../../models/custommodels/drmodels/drskill";
import { DRTruthBullet } from "../../../models/custommodels/drmodels/drtruthbullet";
import { UtilityFunctions } from "../../../utility/general";
import { Bridge, DisabledCommand, OverridedCommand } from "../../interpreter_model";
import { VoiceFunctions } from "../../../utility/voice"
import { RelationshipInterpreter } from "./relationInterp";
import { SkillInterpreter } from "./skillInterp";
import { TBInterpreter } from "./tbInterp";
import { TrialInterpreter } from "./trialInterp";
import { DRCharacterInterpreter } from "./drCharInterp";
import { DRUtilityFunctions } from "../../../utility/custom_utility/dr_utility";


export class DRBridge extends Bridge {
    protected disabledCmds: DisabledCommand[];
    protected overridenCmds: OverridedCommand[];

    constructor (gamedb : Connection,
            tableNameBase: string){
           super(gamedb, tableNameBase)
           this.disabledCmds = [
                new DisabledCommand('character', 
                                    new Map<string, string>([['add','dr-character add-character']])),
                new DisabledCommand('init',
                                    new Map<string, string>([
                                        ['begin', 'dr-trial begin'],
                                        ['end', 'dr-trial end'],
                                        ['add', 'dr-trial add-character']
                                    ]))
            ]
            this.overridenCmds = [
                new OverridedCommand('character', 'dr-character'),
                new OverridedCommand('init', 'dr-trial')
            ]
    }

    async getCharacter(char_name: string): Promise<DRCharacter | null>{
        return await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, char_name)
    }

    initializeTables() {
        DRCharacter.createTable(this.gamedb, this.tableNameBase)
        DRSkill.createTables(this.gamedb, this.tableNameBase)
        DRTruthBullet.createTables(this.gamedb, this.tableNameBase)
        DRRelationship.createTable(this.gamedb, this.tableNameBase)
        DRUtilityFunctions.importGeneralSkills(this.gamedb, this.tableNameBase)
        return true;
    }

    async parse(
        commandName: string,
        subcommandName : string | null,
        options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">,
        activeGame: ActiveGame | null,
        client : Client<boolean>,
        interaction: ChatInputCommandInteraction<CacheType>) : Promise<string | null> 
    {

        if(commandName === 'dr-character'){   
            const drCharInterpreter = new DRCharacterInterpreter(this.gamedb, this.tableNameBase, options, client, interaction)
            const charName = UtilityFunctions.formatString(options.getString('char-name', true))
            switch(subcommandName) {
                case ('add'):
                    return await drCharInterpreter.add(charName)
                case ('remove'):
                    return await drCharInterpreter.remove(charName)
                case ('change-stat'):
                    return drCharInterpreter.changeStat(charName)
                case ('view'):
                    return await drCharInterpreter.view(charName, this)
                case ('view-hd'):
                    return await drCharInterpreter.viewHD(charName)
            }
        }
        else if(commandName === 'dr-relationship') {
            const rsInterpreter = new RelationshipInterpreter(this.gamedb, this.tableNameBase, options, client, interaction)
            const charName1 = UtilityFunctions.formatString(options.getString('character-1', true))
            const charName2 = UtilityFunctions.formatString(options.getString('character-2', true))
            switch(subcommandName) {
                case ('view'):
                    return await rsInterpreter.view(charName1, charName2)
                case ('change'):
                    return await rsInterpreter.change(charName1, charName2)
            }
        }
        else if(commandName === 'dr-skill') {
            const skillInterpreter = new SkillInterpreter(this.gamedb, this.tableNameBase, options, client, interaction)
            switch(subcommandName) {
                case ('add'):
                    return skillInterpreter.add()
                case ('remove'):
                    return skillInterpreter.remove()
                case ('assign'):
                    return await skillInterpreter.assign()
                case ('view'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return await skillInterpreter.view(activeGame)
            }
        }
        else if(commandName === 'dr-tb') {
            const tbInterpreter = new TBInterpreter(this.gamedb, this.tableNameBase, options, client, interaction)
            switch(subcommandName) {
                case ('add'):
                    return await tbInterpreter.add()
                case ('remove'):
                    return tbInterpreter.remove()
                case ('use'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return tbInterpreter.use(activeGame)
                case ('assign'):
                    return await tbInterpreter.assign()
                case ('view'):
                    if(activeGame == null){
                        return 'Issue retrieving active game.'
                    }
                    return await tbInterpreter.view(activeGame)
            }
        } 
        else if(commandName === 'dr-trial') {
            const trialInterpreter = new TrialInterpreter(this.gamedb, this.tableNameBase, options, client, interaction)

            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            switch(subcommandName) {
                case ('begin'):
                    return await trialInterpreter.begin(activeGame)
                case ('end'):
                    return await trialInterpreter.end(activeGame)
                case ('add-character'):
                    return await trialInterpreter.addCharacter(activeGame, this)
                case ('next'):
                    return await trialInterpreter.next(activeGame)
                case ('remove'):
                    return await trialInterpreter.removeCharacter(activeGame)
                case ('active'):
                    return await trialInterpreter.setActiveChar(activeGame)
                case ('hp'):
                    return await trialInterpreter.changeHP(activeGame, this)
                case ('vote'):
                    return await trialInterpreter.vote(activeGame)
                case ('hangman'):
                    return await trialInterpreter.hangman(activeGame)
                case ('interrupt'):
                    return await trialInterpreter.interrupt(activeGame)
            }
        }
        else if(commandName === 'dr-body-discovery'){

            const witnesses = UtilityFunctions.parseMultStr(
                    UtilityFunctions.formatNullString(options.getString('witnesses', true)))
            const discoverers = UtilityFunctions.parseMultStr(
                    UtilityFunctions.formatNullString(options.getString('discoverers', true)))

            if(witnesses == undefined){
                return 'Issue parsing witnesses.'
            }

            if(discoverers == undefined){
                return 'Issue parsing discoverers.'
            }

            witnesses.forEach(async witness => {
                new DRCharacter(witness).updateHD(this.gamedb, this.tableNameBase, 0, 2)
            })

            discoverers.forEach(async discoverer => {
                new DRCharacter(discoverer).updateHD(this.gamedb, this.tableNameBase, 0, 1)
            })

            const audioPlayer = await VoiceFunctions.playAudio('media/body-discovery.mp3')
            const member = (interaction.member as GuildMember)
            const connection = await VoiceFunctions.getConnection(member.voice.channel)

            if(connection == null){
                return '**A Body Has Been Discovered !**'
            }

            await VoiceFunctions.setIdleDisconnect(audioPlayer, connection, 2000)
            connection.subscribe(audioPlayer)

            return '**A Body Has Been Discovered: Listen to Monokuma !**'
        }
        
        return 'Error: Unknown DR Command.'
    }
}