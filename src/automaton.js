/**
 * Creates a map that represents the LR(1) automaton of the production rules
 * @param {Array<Object>} productions An array of production rules
 * @returns {Map<Number, Object>} A map where the keys are indices for transitions and values are the states
 */
export default function createAutomaton(productions) {
    // Generate the FIRST set and turn all Sets into arrays
    const FIRSTWithSets = generateFIRST(productions);
    const FIRST = {};
    for(const key in FIRSTWithSets) {
        FIRST[key] = Array.from(FIRSTWithSets[key]);
    }

    // Create augmented grammar
    productions.unshift({
        leftHandSide: {
            name: productions[0].leftHandSide.name + "'",
            isTerminal: false
        },
        rightHandSide: [
            productions[0].leftHandSide
        ]
    });

    // Create the object of the first closure production
    const firstRule = {
        ...productions[0],
        dotIndex: 0,
        lookAhead: "$"
    }
    
    // Create the first closure from the rule
    const firstClosure = createClosure(firstRule, productions, FIRST);
    const automatonArray = expandClosureToAutomaton(firstClosure, productions, FIRST);

    // Turn the automaton from array into a map
    const automaton = new Map();
    for(let i = 0; i < automatonArray.length; i++) {
        automaton.set(i, automatonArray[i]);
    }

    // Merge duplicate transitions until no more merges can be made
    let mergedStates = mergeAutomaton(automaton);
    while(mergedStates) {
        mergedStates = mergeAutomaton(automaton);
    }

    return automaton;
}



/**
 * Uses production rules to generate the FIRST set for every non-terminal
 * @param {Array<Object>} productions An array of production rules
 * @returns {Object} An object that maps non-terminals to their FIRST set 
 */
function generateFIRST(productions) {
    const FIRST = {};
    
    // Initialize FIRST sets for each non-terminal
    for(const producution of productions) {
        if (!FIRST[producution.leftHandSide.name]) {
            FIRST[producution.leftHandSide.name] = new Set();
        }
    }

    let updated;
    do {
        updated = false;

        for(const production of productions) {
            const leftHandSideName = production.leftHandSide.name;
            const firstSet = FIRST[leftHandSideName];

            // If right-hand side is epsilon, FIRST will be epsilon
            if(production.rightHandSide.length == 1 && production.rightHandSide[0].name == "*") {
                updated = !firstSet.has("*");
                firstSet.add("*");
                continue;
            }

            for(const symbol of production.rightHandSide) {
                // If we find terminal, add it and stop
                if(symbol.isTerminal) {
                    updated = !firstSet.has(symbol.name);
                    firstSet.add(symbol.name);
                    break;

                // If we find non-terminal, add its FIRST to this FIRST
                } else {
                    const symbolFIRST = FIRST[symbol.name];
                    const oldSize = firstSet.size;

                    // Add all items from symbol's FIRST except epsilon
                    symbolFIRST.forEach(item => {
                        if(item != '*') {
                            firstSet.add(item);
                        }
                    });
                    if(firstSet.size != oldSize) {
                        updated = true;
                    }

                    // We only stop if the FIRST of the symbol didn't have epsilon
                    if(!symbolFIRST.has('*')) {
                        break;
                    }
                }
            }
        }
    } while(updated)

    return FIRST;
}



/**
 * Creates a closure state based on the initial production
 * @param {Object} initialProduction Object of the initial production, object has to include dotIndex and lookAhead
 * @param {Array<Object>} allProductions Array of all productions, they don't have to have dotIndex and lookAhead yet
 * @param {Object} FIRST Object that maps every non-terminal to its FIRST set
 * @returns {Object} Object with array of all rules in the closure and empty array of transitions
 */
function createClosure(initialProduction, allProductions, FIRST) {
    // Initialize the state with the given production
    const state = [initialProduction];

    // If the dot is at the end, then we don't have to add other production rules
    if(initialProduction.dotIndex >= initialProduction.rightHandSide.length) {
        return {
            rules: state,
            transitions: []
        }
    }

    // Object to track non-terminals that have been processed
    const processedNonTerminals = {};
    for(const production of allProductions) {
        processedNonTerminals[production.leftHandSide.name] = {};
    }

    // Queue to keep track of productions that need to be processed
    const toProcessQueue = [initialProduction];

    while(toProcessQueue.length > 0) {
        const currentRule = toProcessQueue.shift();
        const currentSymbol = currentRule.rightHandSide[currentRule.dotIndex];

        // Check if the symbol at the dot index is a non-terminal
        if(!currentSymbol.isTerminal) {
            let lookAheads;
            for(const production of allProductions) {
                if(production.leftHandSide.name == currentSymbol.name) {
                    // Create a new closure rule
                    const closureRule = { ...production, dotIndex: 0 };

                    // Determine the look-ahead for the closure rule
                    if(currentRule.dotIndex + 1 == currentRule.rightHandSide.length) {
                        lookAheads = [currentRule.lookAhead];

                    } else if(!currentRule.rightHandSide[currentRule.dotIndex + 1].isTerminal) {
                        lookAheads = FIRST[currentRule.rightHandSide[currentRule.dotIndex + 1].name];
                    } else {
                        lookAheads = [currentRule.rightHandSide[currentRule.dotIndex + 1].name];
                    }

                    // Add the new closure rule to the state and queue
                    for(const lookAhead of lookAheads) {
                        if(!processedNonTerminals[closureRule.leftHandSide.name][lookAhead]) {
                            const newRule = { ...closureRule, lookAhead };
                            state.push(newRule);
                            toProcessQueue.push(newRule);
                        }
                    }
                }
            }
            for(const lookAhead of lookAheads) {
                processedNonTerminals[currentSymbol.name][lookAhead] = true;
            }
        }
    }

    return {
        rules: state,
        transitions: []
    };
}



/**
 * Uses the first closure to do goto operation and create the full automaton
 * @param {Object} firstClosure The first closure of the automaton
 * @param {Object} productions Array of all productions
 * @param {Object} FIRST Object that maps every non-terminal to its FIRST set
 * @returns {Array<Object>} An array with all states of the automaton
 */
function expandClosureToAutomaton(firstClosure, productions, FIRST) {
    // Initialise the automaton with the first closure
    const automatonArray = [firstClosure];

    // Create the other closures and fill in the transitions for each closure
    for(const currentClosure of automatonArray) {
        for(const rule of currentClosure.rules) {

            // There is no transition if the dot is already at the end
            if(rule.dotIndex >= rule.rightHandSide.length) {
                continue;
            }
            const transitionValue = rule.rightHandSide[rule.dotIndex];

            // Create the rule for after the transition
            const newRule = { ...rule }
            newRule.dotIndex++;

            // If the new rule already leads us to a closure created before, set the transition
            let alreadyCreated = false;
            for (let i = 0; i < automatonArray.length; i++) {
                const closureFirstRule = automatonArray[i].rules[0];
                if (areRulesEqual(closureFirstRule, newRule)) {
                    currentClosure.transitions.push({
                        value: transitionValue,
                        closureIndex: i
                    });
                    alreadyCreated = true;
                    break;
                }
            }

            // If it wasn't already created, create the new closure and set the transition
            if(!alreadyCreated) {
                const newClosure = createClosure(newRule, productions, FIRST);
                const automatonLength = automatonArray.push(newClosure);
                currentClosure.transitions.push({
                    value: transitionValue,
                    closureIndex: automatonLength - 1
                });
            }
        }
    }

    return automatonArray;
}



/**
 * Checks if two production rules (with dotIndex and lookAhead) are the same
 * @param {Object} rule1 First production rule
 * @param {Object} rule2 Second production rule
 * @returns {Boolean} True if the rules are the same, false otherwise
 */
function areRulesEqual(rule1, rule2) {
    return rule1.leftHandSide.name == rule2.leftHandSide.name &&
           rule1.dotIndex == rule2.dotIndex &&
           areRightHandSidesEqual(rule1.rightHandSide, rule2.rightHandSide) &&
           rule1.lookAhead == rule2.lookAhead;
}



/**
 * Compares two right-hand-sides if they are the same
 * @param {Array<Object>} rhs1 First right hand side
 * @param {Array<Object>} rhs2 Second right hand side
 * @returns {Boolean} True if the symbols in the arrays are the same, false otherwise
 */
function areRightHandSidesEqual(rhs1, rhs2) {
    return rhs1.length == rhs2.length && rhs1.every((item, index) => item.name == rhs2[index].name);
}



/**
 * If a state has multiple transitions with the same value, then it merges them into a single transition.
 * @param {Map<Number, Object>} automaton The automaton in form of a map, keys are indices and values are states
 * @returns {boolean} True if merges happened, false if there were no merges
 */
function mergeAutomaton(automaton) {
    let mergedStates = false;

    // Iterate over each state in the automaton
    automaton.forEach(state => {
        const transitionMap = new Map(); // To store transitions by their value

        // Loop through the transitions of the current state
        state.transitions.forEach((transition, transitionIndex) => {
            const { value, closureIndex } = transition;

            // Check if there's already a transition with the same value
            if(transitionMap.has(value.name)) {
                const existingTransition = transitionMap.get(value.name);

                // If the transition is pointing to the same state, just delete the transition
                if(existingTransition.closureIndex == closureIndex) {
                    state.transitions.splice(transitionIndex, 1);
                    return;
                }

                // Merge rules of the state we are merging with
                const targetState = automaton.get(existingTransition.closureIndex);
                const sourceState = automaton.get(closureIndex);
                targetState.rules.push(...sourceState.rules);
                targetState.transitions.push(...sourceState.transitions);

                // Update all transitions in the automaton that pointed to the merged state (closureIndex)
                automaton.forEach(state => {
                    state.transitions.forEach(transition => {
                        if (transition.closureIndex === closureIndex) {
                            transition.closureIndex = existingTransition.closureIndex;
                        }
                    });
                });

                // Remove the duplicate transition from the state
                state.transitions.splice(transitionIndex, 1);
                automaton.delete(closureIndex);
                mergedStates = true;

            } else {
                // If no duplicate, add it to the map
                transitionMap.set(value.name, transition);
            }
        });
    });

    return mergedStates;
}
