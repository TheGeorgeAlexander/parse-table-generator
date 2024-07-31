import fs from "node:fs"
import parseGrammar from "./grammar-parser.js";



const grammarFilePath = process.argv[process.argv.length - 1];
const fileContent = fs.readFileSync(grammarFilePath).toString();
const productions = parseGrammar(fileContent);
if(productions == null) {
    process.exit(1)
}

console.log(JSON.stringify(productions, null, 4));
