import readline from "node:readline/promises";


const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


async function main(): Promise<void> {
  try {
    while (true) {
      const userInput = await readlineInterface.question("You: ");

        console.log("you ask this: ", userInput);
        
    }
  } finally {
    readlineInterface.close();
  }
}


await main()

