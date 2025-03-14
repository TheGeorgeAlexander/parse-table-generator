# Parse Table Generator
This is a Node.js script that creates a parse table for an LR(1) compiler from a text file with context-free grammar. I made this tool to assist me with a personal project. It should work for every context-free grammar.

## How to use
1. Clone this repo
2. Create a text file with your context-free grammar. The format of the text file is defined in the paragraph below.
3. Run the generator with `node . <path to grammar file>`.
4. The LR(1) parse table JSON object will be generated and displayed in the terminal as output.

## How grammar is defined
The context-free grammar should be in a text file with a specific format. These are the rules of the text file format:
- Non-terminals only contain uppercase letters.
- Terminals only contain lowercase letters.
- Empty string (epsilon) is denoted using `*`.
- The arrow of a production rule is `--->`.
- Left-hand side of a production rule contains a single non-terminal (context-free grammar).
- No matter its name, the first production rule will be used as the start symbol.
- A line starting with `#` is a comment.

An example of a valid grammar text file would be this:
```
# (Non-)Terminals can be single letters or whole words

START ---> a B | b A
A     ---> a   | *
B     ---> b   | *
```
The grammar would accept these words:
```
a
b
ab
ba
abb
baa
```

## Parse table format
The output of this program is an JSON array. Each element of this array is a row in the parse table.
A row in the parse table has the following format:
```
{
    // Each key is a column in this row
    "<SYMBOL>": {

        // What action to do
        "action": "<goto|shift|reduce>",

        // Only present if the action is goto or shift
        "state": "<INDEX OF ROW>",

        // Only present if the action is reduce
        "production": {
            "leftHandSide": "<SYMBOL>",
            "rightHandSide": [
                "<SYMBOL>",
                "<SYMBOL>",
                ...
            ]
        }
    },
    "<SYMBOL>": {
        ...
    },
    ...
}
```