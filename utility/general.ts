/*infixToPostfix(query: string) {

}*/

import { ChannelType, Guild, Message, TextBasedChannel, Client } from "discord.js"

//ToDo -> Refactor to convert into postfix to all for paranthesis, multiplication, and division
module UtilityFunctions{
    export function errorCheck (cond : boolean, msg : string) {
        if (cond) { throw `Error: ${msg}`};
    }

    export function parseRoll(query: string): [string, number] | undefined{
        query = query.trim()
        const sections = query.split(/([+|-])/g)
        let total = 0
        let retStr = ""
        let op = ''
    
        sections.forEach(sect => {
            //XdY
            //Constant
            //Text (Must be last index)
    
            sect = sect.trim()
    
            if(sect === '+' || sect === '-'){
                op = sect
            } else{
    
                let parseDie = sect.split('d')
                let parseSect = parseInt(sect)
    
                if(parseDie.length > 1){
                    const numRolls = parseDie[0] === '' ? 1 : parseInt(parseDie[0])
                    const diceValue = parseInt(parseDie[1])
    
                    if(isNaN(numRolls) || isNaN(diceValue)){
                        return undefined
                    }
    
                    if(op != ''){
                        retStr += ` ${op} `
                    }
    
                    retStr += `${numRolls}d${diceValue} (`
    
    
                    for(let roll = 0; roll < numRolls; ++roll){
                        let rollValue = getRandomNum(diceValue)
    
                        if(rollValue == diceValue || rollValue == 1){
                            retStr += `**${rollValue}**`
                        } else{
                            retStr += rollValue
                        }

                        if(op === '+' || op === ''){
                            total += rollValue
                        } else if(op === '-'){
                            total -= rollValue
                        }
    
                        if(roll != numRolls - 1){
                            retStr += ', '
                        }
                    }
    
                    retStr += ') '
    
                } else if(!isNaN(parseSect)){
                    switch(op){
                        case '+':
                            retStr += ` + ${parseSect}`
                            total += parseSect
                            break
                        case '-':
                            retStr += ` - ${parseSect}`
                            total -= parseSect
                            break
                    }
                }
    
                op = ''
            }
    
        })
    
        return [retStr, total]
    
    }

    export function getEmojiID(emoji : string | null): string | null{
        let matches = emoji?.match(/[0-9]+/);

        if(matches != null){
            return String(matches[0])
        }

        return emoji;
    }

    export function getEmoteDisplay(client : Client, emote :string | null): string{
        let emoteStr
        if(emote?.length != 2){
            let newEmote = client.emojis.resolve(String(emote))
            emoteStr = newEmote == undefined ? '' : `<:${newEmote.name}:${newEmote.id}>`
        }else{
            emoteStr = emote
        }

        return emoteStr
    }

    export function getRandomNum(cieling: number){
        return Math.floor( Math.random() * cieling) + 1;
    }

    export function scrambleString(str: string) : string{
        if(str.length < 2){
            return str
        }

        const split = getRandomNum(str.length - 1)
        const str1 = str.substring(0, split)
        const str2 = str.substring(split)
        return getRandomNum(2) == 1
        ? scrambleString(str1) + scrambleString(str2)
        : scrambleString(str2) + scrambleString(str1)
    }

    export function formatString(baseStr : string | null, findPattern : string | RegExp = /"|’|'/g, replacerChr : string = ''): string {
        return baseStr == null ? 'null' : baseStr.trim().replace(findPattern, replacerChr)
    }

    export function formatNullString(baseStr : string | null, findPattern : string | RegExp = /"|’|'/g, replacerChr : string = ''): string | null{       
        return baseStr == null ? null : baseStr.trim().replace(findPattern, replacerChr)
    }

    export async function getMessage(guild : Guild | null, channelID: string, msgID: string): Promise<Message<boolean> | undefined>{
        const channel = guild?.channels.cache.find(
            channel => channel.id === channelID
            && channel.type === ChannelType.GuildText) as TextBasedChannel
        return await channel.messages.fetch(msgID).catch( (e) => {return undefined})
    }
    

    export function parseColumns(columns : string | null): Array<[string,string]> | undefined{
        if(columns == null || columns === 'null'){
            return []
        }
        
        let retArr = new Array<[string, string]>

        let colsArr = columns.split(',')

        colsArr.forEach(col =>{
            col = col.trim()

            let statData = col.split('|')

            if(statData.length == 1){
                statData.push('varchar(255)')
            } 

            if(statData.length != 2){
                return undefined
            }

            retArr.push([statData[0].trim().replace(/ /g, '_'), statData[1]])
        })

        return retArr
    }

    export function parseColsStr(columns : string | null): Array<string> | undefined{
        if(columns == null || columns === 'null'){
            return [];
        }
        
        let retArr = new Array<string>;

        let colsArr = columns.split(',');

        colsArr.forEach(col =>{
            col = col.trim();

            if(col.length === 0){
                return undefined;
            }

            if(!col.includes('*.\s*.')){
                col += ' varchar(255)';
            }

            retArr.push(col);
        })

        return retArr;
    }

    export function parseMultStr(multStr : string | null): Array<string> | undefined{
        if(multStr == null || multStr === 'null'){
            return []
        }
        
        return multStr.split('|')
    }

}

export{UtilityFunctions}