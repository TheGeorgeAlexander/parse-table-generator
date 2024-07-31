/**
 * Parses the grammar text file into an array of JSON objects of the productions
 * @param {String} fileContent The content of the grammar text file
 * @returns {Array<JSON>|null} An array of production objects or null on error
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

        const productionRule = {
            leftHandSide: tokens[0],
            rightHandSide: [],
            lineNum: i + 1
        }

        let rightHandProduction = [];
        for(let j = 2; j < tokens.length; j++) {
            const token = tokens[j];
            if(token == "|") {
                productionRule.rightHandSide.push(rightHandProduction);
                rightHandProduction = [];
            } else if(isValidTerminalOrNonTerminal(token)) {
                rightHandProduction.push(token);
            } else {
                console.error(`'${token}' is an invalid (non-)terminal on right hand side in the production rule on line ${i + 1}`);
                return null;
            }
        }

        if(rightHandProduction.length == 0) {
            console.error(`Malformed production rule on line ${i + 1}`);
            return null;
        }

        productionRule.rightHandSide.push(rightHandProduction);
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
    return isValidNonTerminal(word) || /^[A-Z]+$/.test(word);
}



/**
 * Checks whether a word is a valid non-terminal
 * @param {String} word The word/token to check
 * @returns {Boolean} Whether it's a valid non-terminal
 */
function isValidNonTerminal(word) {
    return /^[a-z]+$/.test(word);
}
