import fs from "node:fs"
import parseGrammar from "./grammar-parser.js";
import createAutomaton from "./automaton.js";
import createParseTable from "./table.js";



const grammarFilePath = process.argv[process.argv.length - 1];
const fileContent = fs.readFileSync(grammarFilePath).toString();

// Parse grammar from the text file
const productions = parseGrammar(fileContent);
if(productions == null) {
    process.exit(1)
}

// Create the LR(1) automaton from the production rules
const automaton = createAutomaton(productions);

// Create the actual parse table from the automaton
const parseTable = createParseTable(automaton);

// Print the parse table object
console.log(JSON.stringify(parseTable, null, 4));
