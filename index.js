import { ChatGroq } from "@langchain/groq";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import readline from "node:readline/promises";
import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";


const tool = new TavilySearch({
  maxResults: 3,
  topic: "general",
  // includeAnswer: false,
  // includeRawContent: false,
  // includeImages: false,
  // includeImageDescriptions: false,
  // searchDepth: "basic",
  // timeRange: "day",
  // includeDomains: [],
  // excludeDomains: [],
});

const tools = [tool];
const toolNode = new ToolNode(tools)



// 1. DEFINING THE NODE
// 2.BUILD THE GRAPH
// 3.COMPILE AND INVOKE THE GRAPH

const llm = new ChatGroq({
model: "openai/gpt-oss-120b",
temperature: 0,
maxRetries:2,
maxTokens: undefined,
apiKey: process.env.GROQ_API_KEY,
}).bindTools(tools);

async function callModel(state){
  console.log('...The agent is calling');
  
    const responce = await llm.invoke(state.messages);

    return {messages: [...state.messages, responce]};
}

function shouldContinue(state) {
    const lastmessage = state.messages[state.messages.length -1]

    if(lastmessage.tool_calls.length > 0){
      return "tools"
    }

    return "__end__"
}

const workflow = new StateGraph(MessagesAnnotation)
      .addNode('agent', callModel)
      .addNode('tools', toolNode)
      .addEdge('__start__', 'agent')
      .addEdge('tools', 'agent')
      .addConditionalEdges('agent', shouldContinue )


//compile the graph

const app = workflow.compile();




const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function MyFunc() {
  while (true) {
    const userInput = await r1.question("You: ");

    if(userInput === "/bye" || userInput === "exit") break;

    const finnalState = await app.invoke({
      messages: [{role: 'human', content:userInput}]
    })
    
    console.log("finnalState ", finnalState);
    console.log("Agent:  ", finnalState.messages[finnalState.messages.length -1].content );
    
  }

  r1.close();
}

MyFunc();
