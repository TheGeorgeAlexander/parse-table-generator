/**
 * Turns an LR(1) automaton into a parse table
 * @param {Array<Object>} automaton An array of states representing the automaton
 * @returns {Array<Object} An array representing a parse table
 */
export default function createParseTable(automaton) {
    const parseTable = [];
    const startName = automaton[0].rules[0].leftHandSide.name

    for (let i = 0; i < automaton.length; i++) {
        const state = automaton[i];
        parseTable[i] = {};

        // Shift and Goto actions
        for (const transition of state.transitions) {
            const symbol = transition.value.name;
            const isTerminal = transition.value.isTerminal;
            const closureIndex = transition.closureIndex;

            if (isTerminal) {
                parseTable[i][symbol] = { action: 'shift', state: closureIndex };
            } else {
                parseTable[i][symbol] = { action: 'goto', state: closureIndex };
            }
        }

        // Reduce actions
        for (const rule of state.rules) {
            if (rule.dotIndex == rule.rightHandSide.length) {
                const lookAhead = rule.lookAhead;
                const production = {
                    leftHandSide: rule.leftHandSide.name,
                    rightHandSide: rule.rightHandSide.map(symbol => symbol.name)
                };

                if (rule.leftHandSide.name == startName && lookAhead == "$") {
                    parseTable[i][lookAhead] = { action: 'accept' };
                } else {
                    parseTable[i][lookAhead] = { action: 'reduce', production };
                }
            }
        }
    }

    return parseTable;
}
