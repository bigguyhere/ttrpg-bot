/*infixToPostfix(query: string) {

}*/

//ToDo -> Refactor to convert into postfix to all for paranthesis, multiplication, and division
module UtilityFunctions{
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
                    const numRolls = parseDie[0] === '' ? 1 : parseInt(parseDie[0]), diceValue = parseInt(parseDie[1])
    
                    if(isNaN(numRolls) || isNaN(diceValue)){
                        return undefined
                    }
    
                    if(op != ''){
                        retStr += ` ${op} `
                    }
    
                    retStr += `${numRolls}d${diceValue} (`
    
    
                    for(let roll = 0; roll < numRolls; ++roll){
                        let rollValue = Math.floor(Math.random() * diceValue + 1)
    
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
        let matches = emoji?.match(/[0-9]+/)

        if(matches != null){
            return String(matches[0])
        }

        return emoji

    }

    export function formatString(baseStr : string | null, findPattern : string | RegExp = /'/g, replacerChr : string = ''): string {
        return baseStr == null ? 'null' : baseStr.trim().replace(findPattern, replacerChr)
    }

    export function formatNullString(baseStr : string | null, findPattern : string | RegExp = /'/g, replacerChr : string = ''): string | null{       
        return baseStr == null ? null : baseStr.trim().replace(findPattern, replacerChr)
    }

}

export{UtilityFunctions}