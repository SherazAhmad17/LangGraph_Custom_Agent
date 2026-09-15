import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import readline from "node:readline/promises";


// HERE ARE THE STEPS HAVE TO FOLLOW
//1. Defining a node

function callModel(state:any){
  console.log("calling llm");
  return state
  
}


//Build a graph
const workflow = new StateGraph(MessagesAnnotation)
    .addNode('agent', callModel)
    .addEdge('__start__','agent')
    .addEdge('agent','__end__')

//compile the graph
const app = workflow.compile()


const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


async function main(): Promise<void> {
  try {
    while (true) {
      const userInput = await readlineInterface.question("You: ");

      const finalState = await app.invoke({
        messages: [{role: 'user', content: userInput}]
      })

      console.log("finalState",finalState);
      

        console.log("you ask this: ", userInput);
        
    }
  } finally {
    readlineInterface.close();
  }
}


await main()


