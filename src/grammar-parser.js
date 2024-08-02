/**
 * Parses the grammar text file into an array of JSON objects of the productions
 * @param {String} fileContent The content of the grammar text file
 * @returns {Array<Object>|null} An array of production objects or null on error
 */
export default function parseGrammar(fileContent) {
    const lines = fileContent.split("\n");
    const productions = [];

    for(let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip comments and empty lines
        if(line.startsWith("#") || line.trim() == "") {
            continue;
        }

        // Turn the line into "tokens" based on the whitespace in between
        const tokens = line.split(" ").map(token => token.trim()).filter(token => token != "");
        if(!isPossiblyValidRule(tokens, i + 1)) {
            return null;
        }

        let productionRule = {
            leftHandSide: {
                name: tokens[0],
                isTerminal: false
            },
            rightHandSide: []
        }

        for(let j = 2; j < tokens.length; j++) {
            const token = tokens[j];
            if(token == "|") {
                productions.push(productionRule);
                productionRule = {
                    leftHandSide: {
                        name: tokens[0],
                        isTerminal: false
                    },
                    rightHandSide: []
                };

            } else if(isValidTerminalOrNonTerminal(token)) {
                productionRule.rightHandSide.push({
                    name: token,
                    isTerminal: !isValidNonTerminal(token)
                });

            } else {
                console.error(`'${token}' is an invalid (non-)terminal on right hand side in the production rule on line ${i + 1}`);
                return null;
            }
        }

        if(productionRule.rightHandSide.length == 0) {
            console.error(`Malformed production rule on line ${i + 1}`);
            return null;
        }

        productions.push(productionRule);
    }

    return productions;
}



/**
 * Checks whether the production rule is in the correct format
 * @param {Array<String>} tokens An array of tokens of the rule
 * @returns {Boolean} True if it follows the general rules of the text format
 */
function isPossiblyValidRule(tokens, lineNum) {
    if (tokens.length < 3) {
        console.error(`Malformed production rule on line ${lineNum}`);
        return false;
    }
    if (!isValidNonTerminal(tokens[0])) {
        console.error(`'${tokens[0]}' is an invalid non-terminal on left hand side in the production rule on line ${lineNum}`);
        return false;
    }
    if (tokens[1] != "--->") {
        console.error(`Malformed production rule on line ${lineNum + 1}`);
        return false;
    }
    return true;
}



/**
 * Checks whether a word is a valid terminal or non-terminal
 * @param {String} word The word/token to check
 * @returns {Boolean} Whether it's a valid terminal or non-terminal
 */
function isValidTerminalOrNonTerminal(word) {
    return isValidNonTerminal(word) || /^[a-z]+$/.test(word) || word == "*";
}



/**
 * Checks whether a word is a valid non-terminal
 * @param {String} word The word/token to check
 * @returns {Boolean} Whether it's a valid non-terminal
 */
function isValidNonTerminal(word) {
    return /^[A-Z]+$/.test(word);
}
