import { ChannelType, Guild, Message, TextBasedChannel, Client } from "discord.js"

module UtilityFunctions{

    /**
     * Given a condition, checks if that condition is true or false. If the condition is true, the function throws an error
     * @param cond Boolean condition to be error checked
     * @param msg Message to return as thrown error message if boolean condition resolves to TRUE
     */
    export function errorCheck (cond : boolean, msg : string) {
        if (cond) { throw `Error: ${msg}`};
    }

    /**
     * Takes an operator and gives the precedence value of the operator. Follows GEMDAS.
     * @param op Function operator character
     * @returns  Precedence value (Lower value means higher precedence). -1 is returned in case of error.
     */
    function precedence(op: string){
        switch(op){
            case '^': 
                return 1;
            case '*':
            case '/':
                return 2;
            case '+':
            case '-':
                return 3;
            default:
                return -1;
        }
    }    

    /**
     * Returns a boolean array indicating an arbitrary amount of minima/maxima locations in a given rolls array 
     * @param rolls Array of rolls to find the extrema for
     * @param amnt  Amount of extrema to find in the rolls array
     * @param findMax If true, finds the maxima of the array. Otherwise finds minima
     * @returns A boolean array of the same length as rolls, indicating the highest/lowest indexes of the rolls away with true values
     */
    function findMaxMin(rolls : Array<number>, amnt : number, findMax : boolean) : Array<boolean>{

        if(amnt == 0) { 
            return [];
        }

        let extrema : Array<boolean> = [];
        const compFunc : Function = findMax ? (a : number, b : number) => a > b : (a : number, b : number) => a < b; // Finds max or min depending on input

        for(let ind = 0; ind < rolls.length; ++ind){ // Instantiate all values in extrema array
            extrema[ind] = false;
        }

        for (let ind = 0; ind < amnt; ++ind) {
            let extInd : number = 0;

            for(let rollInd = 0; rollInd < rolls.length; ++rollInd) {
                if((compFunc(rolls[rollInd], rolls[extInd]) && !extrema[rollInd]) || extrema[extInd]){ // If is an extrema and not a duplicate extrema
                    extInd = rollInd;
                }
            }
            extrema[extInd] = true; // Prevents processing duplicate extrema
        }

        return extrema;

    }
    
    /**
     * Evaluates a numerical or dice format string into an integer. 
     * @param value Numerical (X) or dice format (XdY) string that is to be parsed into a numerical value
     * @returns Returns string and numerical value of numberical string. Returns results of die rolls and total value rolled of die format string.
     */
    function evaluate(value : string) : [string, number] {
        if (value.includes('d')){ // Die Format
            const splitArr = value.split(/d|t|b|e/g);
            let numRolls : number; // Number of dice to roll
            const diceValue = parseInt(splitArr[1]); // Number of faces on die
            let op : string | undefined = undefined;
            let opValue : number = -1;

            if(value.endsWith('adv')){ // Equivalent to 2dYt1
                numRolls = 2;
                op = 't';
                opValue = 1;
                value = `1d${diceValue}t2`;
            } else if (value.endsWith('dis')){ // Equivalent 2dYb1
                numRolls = 2;
                op = 'b';
                opValue = 1;
                value = `1d${diceValue}b2`;
            } else if (value.includes('b')){ // Takes the bottom Z dice (XdYbZ)
                numRolls = splitArr[0].length === 0 ? 1 : parseInt(splitArr[0]);
                op = 'b';
                opValue = parseInt(splitArr[2]);
            } else if (value.includes('t')){ // Takes the top Z dice (XdYtZ)
                numRolls = splitArr[0].length === 0 ? 1 : parseInt(splitArr[0]);
                op = 't';
                opValue = parseInt(splitArr[2]);
            } else if (value.includes('e')){ // Explodes dice that meet the value Z by rolling another die with value Y (XdYeZ)
                numRolls = splitArr[0].length === 0 ? 1 : parseInt(splitArr[0]);
                op = 'e';
                opValue = parseInt(splitArr[2]);
            } else {
                numRolls = numRolls = splitArr[0].length === 0 ? 1 : parseInt(splitArr[0]);
            }

            errorCheck(opValue > diceValue, `Value for **${op}** (*${opValue}*) cannot exceed the diceValue value (*${diceValue}*)`);

            let rolls : number[] = [];
            let retStr = `${value} (`;
            let total = 0;
            for(let roll = 0; roll < numRolls; ++roll){
                const rollValue = getRandomNum(diceValue); // Rolls die 

                rolls.push(rollValue);

                if(op == 'e' && rollValue == opValue) { // Explodes dice if value to explode is met
                    numRolls++;
                }

            }

            let extrema : Array<boolean> = [];
            if(op == 't' || op == 'b') { // Finds extrema for keeping top/bottom amount of dice
                extrema = findMaxMin(rolls, opValue, op === 't');
            }
            
            // Formats each roll in output string
            for(let rollInd = 0; rollInd < rolls.length; ++rollInd) {
                const roll = rolls[rollInd];
                let strBuilder = String(roll);

                if(op == 'e' && roll == opValue) { // Adds ! for dice that explode
                    strBuilder += '!';
                }

                if((op == 't' || op == 'b') && !extrema[rollInd]){ // Adds strikethrough to rolls not being considered
                    strBuilder = `~~${strBuilder}~~`
                }  else { // Rolls that are being considered are added to total
                    total += roll;
                }

                if(roll == 1 || roll == diceValue){ // If die is min or max value, bold the value
                    strBuilder = `**${strBuilder}**`;
                }

                retStr += `${strBuilder}, `
            }
            
            if(retStr[retStr.length - 1] == ' ') { // Removes trailing comma if exists
                retStr = retStr.substring(0, retStr.length - 2) + ')'
            }
            
            return [retStr, total];
        } else { // Numerical Format
            return [value, parseInt(value)];
        }
    }

    /**
     * Converts infix statement into a postfix statement for numerical calculations
     * @param query Infix mathematical statement that includes either operators (+, -, *, /, ^), die format (i.e. 1d20), or numerical constants (i.e. 20)
     * @returns Postfix representation of the infix statement inputted
     */
    export function infixToPostfix(query: string): [(string | number)[], string] {
        query = query.replace(/ +/g, ''); // Removes whitespace

        // Matches operators, dice format (XdY), or numerical constants
        const sections = query.match(/\+|-|-|\^|\(|\)|\/|\*|1?d[0-9]+(adv|dis)|[0-9]*d[0-9]+[[t|b|e]?[0-9]+]?|[0-9]+/g) as Array<string>;

        errorCheck(sections == null || sections.length == 0, 'Roll query is invalid');

        let retArr : (string | number)[] = [];
        let retStr = '';
        let opStack : string[] = [];
       
        sections.forEach(sect => {
            let prec = precedence(sect);

            if(prec !== -1){

                let peekElem = opStack[opStack.length - 1];
                while(precedence(peekElem) !== -1 && prec >= precedence(peekElem)){ // Pop operators until value of equal or higher precedence is found
                    retArr.push(opStack[opStack.length - 1]);
                    opStack.pop();
                    peekElem = opStack[opStack.length - 1];
                }
                
                opStack.push(sect);
                retStr += ` ${sect} `;
            } else if (sect == '('){
                opStack.push(sect);
                retStr += `${sect}`;
            } else if (sect == ')'){

                let op = opStack.pop();

                while(op !== undefined && op != '('){ // Pop operators until starting ( is found
                    retArr.push(op);
                    op = opStack.pop();
                }
                retStr += `${sect} `;

            } else { 
                const evaluation = evaluate(sect); // Evaluates numerical constants and dice
                retArr.push(evaluation[1]); // Pushes the total numerical value onto the return array
                retStr += evaluation[0]; // Puts the string represtentation of the result in the return string
            }

        });

        // Put anything remaining in the stack in the return array
        let op = opStack.pop();
        while(op !== undefined){
            retArr.push(op);
            op = opStack.pop();
        }

        return [retArr, retStr];
    }


    /**
     * Takes in an infix notated roll query and returns both a total numerical result and string representation of the operation
     * @param query Roll query to be parsed and evaluated for the user in infix notation
     * @returns - String representation and numerical representation of the roll operation
     */
    export function parseRoll(query: string) : [string, number] {
        const postfix = infixToPostfix(query); // Converts the statement to postfix
        let operandStack : number[] = [];

        postfix[0].forEach(elem => {
            if(typeof elem == 'number'){ // Pushes numerical operands onto the stack
                operandStack.push(elem);
            } else { // When an operator string appears, pops two operands and performs the operator's function on them
                const operand1 = operandStack.pop();
                const operand2 = operandStack.pop();

                if(operand1 == undefined || operand2 == undefined) { // Check if statement is valid
                    throw 'Error: cannot parse expression';
                }
                
                switch(elem){ // Pushes result of operation back into operand stack for further computation
                    case '+':
                        operandStack.push(operand2 + operand1);
                        break;
                    case '-':
                        operandStack.push(operand2 - operand1);
                        break;
                    case '*':
                        operandStack.push(operand2 * operand1);
                        break;
                    case '/':
                        operandStack.push(operand2 / operand1);
                        break;
                    case '^':
                        operandStack.push(Math.pow(operand2, operand1));
                        break;
                }
            }
        });

        errorCheck(operandStack.length != 1, 'Roll query is invalid');

        return [postfix[1].trim(), operandStack.pop() as number]
    }

    /**
     * 
     * @param emoji 
     * @returns 
     */
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
            return [];
        }
        
        let retArr = new Array<[string, string]>;

        let colsArr = columns.split(',');

        colsArr.forEach(col =>{
            col = col.trim();

            let statData = col.split('|');

            if(statData.length == 1){
                statData.push('varchar(255)');
            } 

            if(statData.length != 2){
                return undefined;
            }

            retArr.push([statData[0].trim().replace(/ /g, '_'), statData[1]]);
        })

        return retArr;
    }

    export function parseColStr(columns : string | null): Array<string> | undefined{
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