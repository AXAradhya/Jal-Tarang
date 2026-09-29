const fs = require('fs');
const readline = require('readline');
const stream = fs.createReadStream('C:/Users/Aradhya/.gemini/antigravity-ide/brain/19e109ee-4ae2-4c13-b911-06fca223a8ca/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.includes('"step_index":10708') || line.includes('"step_index":10709')) {
    console.log(line);
  }
});
