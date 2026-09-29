const fs = require('fs');
const readline = require('readline');
const stream = fs.createReadStream('C:/Users/Aradhya/.gemini/antigravity-ide/brain/19e109ee-4ae2-4c13-b911-06fca223a8ca/.system_generated/logs/transcript.jsonl');
const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

rl.on('line', (line) => {
  if (line.includes('finished with result') || line.includes('task-11872 finished')) {
    console.log(line);
  }
});
