import fs from "node:fs"
import parseGrammar from "./grammar-parser.js";
import createAutomaton from "./automaton.js";



const grammarFilePath = process.argv[process.argv.length - 1];
const fileContent = fs.readFileSync(grammarFilePath).toString();

// Parse grammar from the text file
const productions = parseGrammar(fileContent);
if(productions == null) {
    process.exit(1)
}

// Create the LR(1) automaton from the production rules
const automaton = createAutomaton(productions);

// Log the automaton as a DOT file
let dotFile = "digraph G {\n    rankdir=\"LR\"\n    node [ shape=box ]\n";
automaton.forEach((value, index) => {
    dotFile += `    ${index} [ label="[${index}]\\n\\n${getClosureString(value).replace(/\n/g, "\\n")}" ]\n`;
    for(const transition of value.transitions) {
        dotFile += `    ${index} -> ${transition.closureIndex} [ label="${transition.value?.name}" ]\n`;
    }
});
dotFile += "}";
console.log(dotFile);




function getClosureString(closure) {
    let string = "";
    for(const rule of closure.rules) {
        let rightHandSide = [...rule.rightHandSide];
        rightHandSide.splice(rule.dotIndex, 0, {name: "."});
        string += rule.leftHandSide.name + " ---> " + rightHandSide.map(symbol => symbol.name).join(" ") + "    " + rule.lookAhead + "\n";
    }
    return string.trim();
}
