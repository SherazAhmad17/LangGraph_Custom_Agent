import { AIMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import readline from "node:readline/promises";

const searchTool = new TavilySearch({ maxResults: 3, topic: "general" });

const tools = [searchTool];
const toolNode = new ToolNode(tools);

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  maxRetries: 2,
  maxTokens: undefined,

  // In production, environment variables should be validated
  // before the application starts.
  apiKey: process.env.GROQ_API_KEY,
}).bindTools(tools);

// HERE ARE THE STEPS HAVE TO FOLLOW
//1. Defining a node

async function callModel(state: typeof MessagesAnnotation.State) {
  console.log("calling llm");
  const response = await llm.invoke(state.messages);
  return { messages: [...state.messages, response] };
}

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const finalMessage = state.messages[state.messages.length - 1];

  if (
    AIMessage.isInstance(finalMessage) &&
    finalMessage.tool_calls &&
    finalMessage.tool_calls.length > 0
  ) {
    return "tools";
  }

  return "__end__";
}

//Build a graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

//compile the graph
const app = workflow.compile();

const readlineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main(): Promise<void> {
  try {
    while (true) {
      const userInput = await readlineInterface.question("You: ");

      const finalState = await app.invoke({
        messages: [{ role: "user", content: userInput }],
      });

      const finalMessage = finalState.messages[finalState.messages.length - 1];

      console.log(finalMessage?.content);

      // console.log("finalState", finalState);

      // console.log("you ask this: ", userInput);
    }
  } finally {
    readlineInterface.close();
  }
}

await main();
