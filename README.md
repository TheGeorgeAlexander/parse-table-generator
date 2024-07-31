# Parse Table Generator
This is a Node.js script that creates a parse table for an LR(0) compiler from a text file with context-free grammar. I made this tool to assist me with a personal project. It might not work for every grammar you throw at it.

## How is grammar defined
The context-free grammar should be in a text file with a specific format. Every line in the text file is a production rule. Non-terminals should be all lowercase and the terminals should be fully capitalised. The arrows in the production rules look like `--->`, they have to have three dashes. Lines starting with `#` are comments. The generator assumes the first production rule is the start.

An example of a valid grammar text file would be this:
```
# This is a comment

start    ---> ASSIGN addition
addition ---> addition PLUS NUMBER | NUMBER
```
Assuming the terminals would be defined as following.
- ASSIGN is the '=' character
- PLUS is the '+' character
- NUMBER is any integer number

Then the grammar would accept lines like this:
```
=2+45
=394+22+42
=24
```

## How to use
1. Clone this repo
2. Create a text file with your context-free grammar. The format of the text file is defined in the paragraph above.
3. Run the generator with `node . <path to grammar file>`.
4. The LR(0) parse table will be generated and displayed in the terminal as output.