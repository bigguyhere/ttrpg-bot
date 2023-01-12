import { ActiveGame } from "../../../models/activegame"
import { DRCharacter } from "../../../models/custommodels/drmodels/drcharacter"
import { DRRelationship } from "../../../models/custommodels/drmodels/drrelationship"
import { DRTruthBullet } from "../../../models/custommodels/drmodels/drtruthbullet"
import { DRVote } from "../../../models/custommodels/drmodels/drvote"
import { Initiative } from "../../../models/initiative"
import { UtilityFunctions } from "../../../utility/general"
import { Bridge } from "../../interpreter_model"
import { InitInterpreter } from "../../std_interpreters/initInterp"

export class TrialInterpreter extends InitInterpreter{

    public async begin(activeGame : ActiveGame) : Promise<string>{
        if(activeGame.messageID != null){
            return 'Cannot start trial as there is already one in progress.'
            + ' Please end other trial before starting a new one.'
        }

        let addAll = this.options.getBoolean('add-all')
        const blackened = UtilityFunctions.formatString(this.options.getString('blackened', true))
        const vicitms = UtilityFunctions.parseMultStr(
                UtilityFunctions.formatString(this.options.getString('victims', true)))

        if(vicitms == undefined){
            return 'Issue parsing victims.'
        }

        const killer = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, blackened)
            
        if(killer == null){
            return `Error finding character ${killer}.`
        }

        killer.updateStat(this.gamedb, this.tableNameBase, 'Status', 'Blackened')
        killer.updateHD(this.gamedb, this.tableNameBase, 0, 3)

        const changes = await DRRelationship.getHDChange(this.gamedb, this.tableNameBase, 'Victim')

        if(changes == null){
            return 'Issue retrieving character relationships.'
        }

        changes.forEach(change =>{
            if(change[1] != 0){
                let chr = new DRCharacter(change[0])
                change[1] > 0 
                ? chr.updateHD(this.gamedb, this.tableNameBase, change[1], 0)
                : chr.updateHD(this.gamedb, this.tableNameBase, 0, change[1] * -1)
            }
        }) 

        vicitms.forEach(async victim => {
            const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, victim)
            
            if(chr == null){
                return `Error finding character ${victim}}.`
            }
            
            chr.updateStat(this.gamedb, this.tableNameBase, 'Status', 'Victim')

        })

        let retStr = await this.initSetup(activeGame, '2d6', true, 'The Class Trial')
        
        if(addAll){
            const chrs = await DRCharacter.getAllCharacters(this.gamedb, this.tableNameBase, true)

            if(chrs == null){
                return 'Issue getting characters.'
            }

            for(const chr of chrs) {
                let user = this.userID

                if(chr.owner != ''){
                    user = chr.owner
                }

                const result = UtilityFunctions.parseRoll(`2d6 + ${chr.brains}`)

                if(result == undefined){
                    return 'Error parsing roll.'
                }

                if(!(await new Initiative(chr.name, result[1], chr.emote, user).addToTable(this.gamedb, this.tableNameBase))){
                    return 'Error: Character is already in initiative.'
                }

                retStr += `\nCharacter **\"${chr.name}\"** added to initiative: ${result[0]} = __*${result[1]}*__\n`
            }

            if(activeGame.channelID != null){
                let message = await UtilityFunctions.getMessage(this.interaction.guild,
                                                                activeGame.channelID, 
                                                                String(activeGame.messageID))
                message?.edit(await Initiative.buildInitMsg(this.gamedb, this.tableNameBase, activeGame))
            }
        }

        return retStr
    }

    public async end(activeGame : ActiveGame) : Promise<string>{

        if(activeGame?.messageID == null){
            return 'Cannot end trial as there is none in progress.'
        }

        let chrs = await DRCharacter.getAllCharacters(this.gamedb, this.tableNameBase, true)

        if(chrs == null){
            return 'Issue getting characters.'
        }

        const chrName1 = UtilityFunctions.formatString(this.options.getString('cs-char1'))
        const chrName2 = UtilityFunctions.formatString(this.options.getString('cs-char2'))

        chrs.forEach(chr => {
            const hope = chr.name === chrName1 || chr.name === chrName2 ? 4 : 1
            chr.updateHD(this.gamedb, this.tableNameBase, hope, 1)
        });

        DRVote.createTable(this.gamedb, this.tableNameBase)
        DRVote.generateVotes(this.gamedb, this.tableNameBase, chrs)

        return 'The Trial Concludes ! Vote for the blackened using the **/dr-trial vote** command !'
    }

    public async addCharacter(activeGame: ActiveGame, bridge: Bridge): Promise<string> {
        if(activeGame.messageID == null){
            return 'Cannot add character to trial as there is none in progress.'
        }

        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        let emote = UtilityFunctions.getEmojiID(
                        UtilityFunctions.formatString(this.options.getString('emote'))
                    )

        const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)
        let user = this.userID

        if(chr != null){
            if(chr.owner != ''){
                user = chr.owner
            }
            
            if(emote == null){
                emote = chr.emote
            }
        }

        const query = this.options.getString('query')

        const result = UtilityFunctions.parseRoll(query == null 
                                                ? `${activeGame.defaultRoll}${
                                                                                chr == null 
                                                                                ? '' 
                                                                                : ` + ${chr.brains}`}` 
                                                : query)

        if(result == undefined){
            return 'Error parsing roll.'
        }

        if(!(await new Initiative(chrName, result[1], emote, user).addToTable(this.gamedb, this.tableNameBase))){
            return 'Error: Character is already in initiative.'
        }

        if(activeGame.channelID != null){
            let message = await UtilityFunctions.getMessage(this.interaction.guild,
                                                            activeGame.channelID, 
                                                            activeGame.messageID)
            message?.edit(await Initiative.buildInitMsg(this.gamedb, this.tableNameBase, activeGame))
        }  

        return `Character **\"${chrName}\"** added to trial: ${result[0]} = __*${result[1]}*__\n`
    }

    public async vote(activeGame : ActiveGame) : Promise<string>{
        
        if(! await DRVote.ifExists(this.gamedb, this.tableNameBase)){
            return 'Error: Trial has not been ended yet.'
        }

        const voterName = UtilityFunctions.formatString(this.options.getString('voter-chr', true))
        const voteName = UtilityFunctions.formatString(this.options.getString('vote', true))

        const voter = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, voterName)
        const vote = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, voteName)

        if(voter == null){
            return `Error finding character ${voterName}.`
        }

        if(vote == null){
            return `Error finding character ${voteName}.`
        }

        if(this.userID != voter.owner){
            return 'Cannot Vote with this character, as you are not the owner.'
        }

        const voterStatus = voter.status?.toUpperCase()
        if(voterStatus === 'VICTIM' || voterStatus === 'DEAD'){
            return `Apologies, Character **${voterName}** Cannot vote while dead.`
        }

        new DRVote(voter, vote).updateVote(this.gamedb, this.tableNameBase)

        const remainingVotes = await DRVote.countRemainingVotes(this.gamedb, this.tableNameBase)

        if(remainingVotes == 0){
            if(activeGame == null){
                return 'Issue retrieving active game.'
            }

            let results = await DRVote.getResults(this.gamedb, this.tableNameBase)
            
            Initiative.dropTable(this.gamedb, this.tableNameBase)
            DRVote.dropTable(this.gamedb, this.tableNameBase)
            
            const changes = await DRRelationship.getHDChange(this.gamedb, this.tableNameBase, 'Blackened')

            if(changes == null){
                return 'Issue retrieving character relationships.'
            }
            
            changes.forEach(change =>{
                if(change[1] != 0){
                    let chr = new DRCharacter(change[0])
                    change[1] > 0 
                    ? chr.updateHD(this.gamedb, this.tableNameBase, change[1], 0)
                    : chr.updateHD(this.gamedb, this.tableNameBase, 0, change[1] * -1)
                }
            }) 

            if(activeGame.channelID != null && activeGame.messageID != null){
                let message = await UtilityFunctions.getMessage(this.interaction.guild, 
                                                                activeGame.channelID, 
                                                                activeGame.messageID)
                message?.unpin()

                activeGame.updateInit(this.gamedb, null, null, '2d6', 0, 0, true)

                const embedBuilder = DRVote.buildSummaryEmbed(this.interaction.guild, results)

                if(embedBuilder == undefined){
                    return `Issue finding Character.`
                }

                message?.channel.send({embeds : [embedBuilder] })
            }
            const blackened = results[0]
            if(blackened[0] == null){
                return 'Issue finding name of blackened.'
            }
            const nameStr = blackened[0].talent == null ? blackened[0].name : `The ${blackened[0].talent}: ${blackened[0].name}`

            DRCharacter.setToDead(this.gamedb, this.tableNameBase, blackened[0].status !== 'Blackened')
            
            return `All votes counted ! The blackened was chosen to be **${nameStr}** with **${blackened[1]}** votes !`
        }

        return `A character has voted. **${remainingVotes}** votes remain.`
    }

    public async hangman(activeGame : ActiveGame) : Promise<string>{
        if(activeGame.turn == 0){
            return 'Cannot initiate a hangman\'s gambit when initiative hasn\'t started.'
        }

        if(activeGame.messageID == null){
            return 'Cannot initiate a hangman\'s gambit as there is no current initiaitve.'
        }

        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)

        if(chr == null){
            return 'Issue getting character.'
        }

        chr.updateHD(this.gamedb, this.tableNameBase, -1, 0)

        const word = UtilityFunctions.formatString(this.options.getString('word', true))

        const client = this.interaction.guild?.client
        if(client == undefined){
            return 'Issue finding server.'
        }
        client.users.cache.get(chr.owner)?.send(
            `**Hangman\'s Gambit Begin !**\nYour word is: __*${UtilityFunctions.scrambleString(word).toUpperCase()}*__`)

        return `${chrName} has initiated a hangman's gambit !`
    }

    public async interrupt(activeGame : ActiveGame) : Promise<string>{

        if(activeGame.turn == 0){
            return 'Cannot change trial initiative when initiative hasn\'t started.'
        }

        if(activeGame.messageID == null){
            return 'Cannot change trial initiative as there is none in progress.'
        }

        const chrName = UtilityFunctions.formatString(this.options.getString('char-name', true))
        const tbName = UtilityFunctions.formatString(this.options.getString('tb-name', true))
        const type = this.options.getNumber('type')
        const consentGifs = ['https://tenor.com/view/consent-makoto-danganronpa-gif-25163640',
                             'https://tenor.com/view/consent-gif-20460974',
                             'https://tenor.com/view/danganronpa-v3-consent-gif-19290276']
        const counterGifs = ['https://tenor.com/view/makoto-naegi-danganronpa-counter-gif-25163631',
                            'https://tenor.com/view/danganronpa-scream-counter-gif-11893855',
                            'https://tenor.com/view/shuichi-saihara-shuichi-saihara-danganronpa-objeciton-gif-18332631']
        const rebuttalGifs = ['https://tenor.com/view/rebuttal-showdown-danganronpa-gundham-tanaka-gif-21093184',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-mahiru-koizumi-gif-21093190',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-sonia-nevermind-gif-21093192',
                            'https://tenor.com/view/nagito-danganronpa-danganronpa-counter-no-thats-wrong-danganronpa-nagito-gif-19547097',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-fuyuhiko-kuzuryu-gif-21093189',
                            'https://tenor.com/view/rantaro-danganronpa-rantaro-amami-ranta-avocado-gif-15805354',
                            'https://tenor.com/view/danganronpa-luizdoro_no_more-tenko-tenko2-gif-19039626',
                            'https://tenor.com/view/danganronpa-luizdoro_no_more-tsumigi1-tsumigi-gif-19039633',
                            'https://tenor.com/view/danganronpa-luizdoro_no_more-kaito-kaito2-gif-19039404',
                            'https://tenor.com/view/korekiyo-korekiyo-objection-luizdoro_no_more-danganronpa-gif-19039050',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-kasucichi-soda-gif-21093188',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-akane-owari-gif-21093185',
                            'https://tenor.com/view/rebuttal-showdown-danganronpa-peko-pekoyama-gif-21093191',
                            'https://tenor.com/view/miu-objection-miu-danganronpa-gif-19028592',
                            'https://tenor.com/view/kokichis-rebuttal-gif-20029871']

        let retStr = '', gif = ''

        //Needed to assert character is in initiative already
        const initChr = await Initiative.getInitChr(this.gamedb, this.tableNameBase, chrName)

        if(initChr == null){
            return 'Issue finding initiative character.'
        }
        
        if (!initChr.changeInit(this.gamedb, this.tableNameBase, activeGame)){
            return 'Error: Initiative hasn\'t started yet'
        }

        if(activeGame.channelID != null){
            let message = await UtilityFunctions.getMessage(this.interaction.guild, 
                                                            activeGame.channelID, 
                                                            activeGame.messageID)
            message?.edit(await Initiative.buildInitMsg(this.gamedb, this.tableNameBase, activeGame))

            retStr += `**${chrName}** `
        }

        if(type != null){
            if(type == 0){
                retStr += 'consents !'
                gif = consentGifs[UtilityFunctions.getRandomNum(consentGifs.length)]
            }else if(type == 1){
                retStr += 'counters !'
                gif = counterGifs[UtilityFunctions.getRandomNum(counterGifs.length)]
            } else if(type == 2){
                retStr += 'initaites a rebuttal showdown !'
                gif =rebuttalGifs[UtilityFunctions.getRandomNum(rebuttalGifs.length)]
                
                const chr = await DRCharacter.getCharacter(this.gamedb, this.tableNameBase, chrName)

                if(chr != null){
                    chr.updateHD(this.gamedb, this.tableNameBase, 1, 0)
                }
            }else{
                return 'Invalid type.'
            }
        } else{
            retStr += 'interrupts !'
        }

        retStr +=  ' It\'s now their turn !\n'

        const tb = await DRTruthBullet.getTB(this.gamedb, this.tableNameBase, tbName, null)
        
        if(tb == null){
            return 'Issue finding Truth Bullet.'
        }

        tb.useTB(this.gamedb, this.tableNameBase)

        retStr += `\n**${tbName}:** ${tb.desc}\n${gif}`

        return retStr
    }

}