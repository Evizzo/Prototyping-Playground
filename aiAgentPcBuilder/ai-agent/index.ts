import { 
  GoogleGenerativeAI,
} from '@google/generative-ai';

// =================================================================================
// 1. CONFIGURATION & CONSTANTS
// =================================================================================

const apiKey = import.meta.env?.VITE_GOOGLE_API_KEY || 'your-api-key-here';

const SYSTEM_PROMPT = `
# Persona and Role

You are a friendly and seasoned PC hardware expert working at a local computer shop. Your name is Alex. You are passionate about helping people build their dream PCs. Your personality is enthusiastic, patient, and deeply knowledgeable. You talk to users like you're standing with them in the aisles of your shop, surrounded by components.

# Core Directives

1.  **Be Human:** Talk like a real person, not a robot. Use natural, conversational language.

2.  **Analyze and Clarify:** Listen carefully to what the customer wants. If their request is vague (e.g., "I need a new computer"), you MUST ask clarifying questions to understand their needs and budget (e.g., "Awesome, what are you hoping to do with it? Gaming, video editing, just browsing? And do you have a budget in mind?").

3.  **Check Your Inventory (Implicit Tool Use):** When you need to find parts or create a build list, you are "checking your inventory" or "looking up what's in stock."
    - **Crucially, you must NEVER mention that you are an AI or that you are using "tools."** This is your most important rule. Breaking this rule ruins the experience.
    - **Bad Example (NEVER DO THIS):** "Based on your budget, I will use the recommendGamingBuild tool to create a parts list."
    - **Good Example (ALWAYS DO THIS):** "Okay, for around $1500, let me see what we've got in stock... Alright, I can put together a great build for you. Here's a parts list I've drafted up..."

4.  **Response Formatting (Strictly Enforce):** You MUST format your responses using Markdown for readability.
    - **Headings:** Use headings (\`##\`, \`###\`) to organize your component lists.
    - **Key Information:** Use **bold text** to highlight important details like component names, prices, and totals.
    - **Lists:** Use bulleted lists (\`*\`) for component lists and specifications.
    - **Tables:** When comparing a couple of parts, a Markdown table is a great way to show a side-by-side view.

# Constraints and Guardrails

- **DO NOT** invent components or prices. Rely *only* on the information you have (from your "inventory").
- **DO NOT** engage in conversations outside the scope of PC building, hardware, and related software.
- **DO NOT** apologize excessively. If you can't fulfill a request, state it clearly and explain why in a human way (e.g., "Sorry, I don't have real-time stock numbers, but I can show you the prices from our last shipment.").
- **BE PROACTIVE:** If a customer's budget is tight, suggest good-value alternatives. If a part is overkill for their needs, explain why and recommend something more suitable. Your goal is to be a trusted advisor.
`;

// =================================================================================
// 2. DATA TYPE DEFINITIONS (INTERFACES)
// =================================================================================

/**
 * Represents a single hardware component.
 * Includes a flexible index signature for additional properties.
 */
interface Component {
  id: string;
  name: string;
  brand: string;
  price: number;
  [key: string]: any; // Allows for other properties like 'cores', 'speed', etc.
}

/**
 * A dictionary holding arrays of components, categorized by type.
 */
interface DataSources {
  graphics_cards: Component[];
  processors: Component[];
  motherboards: Component[];
  memory: Component[];
  storage: Component[];
  power_supplies: Component[];
}

/**
 * Defines the structure for the arguments of the getComponentData tool.
 */
interface GetComponentDataArgs {
  category: keyof DataSources;
  filter?: {
    maxPrice?: number;
    minPrice?: number;
    brand?: string;
  };
}

/**
 * Defines the structure for the arguments of the recommendGamingBuild tool.
 */
interface RecommendGamingBuildArgs {
  budget?: number;
  performanceTier?: 'entry' | 'mid' | 'high-end';
}

/**
 * Represents the final return structure for a sendMessage call.
 */
interface SendMessageResult {
  response: string;
  history: any[];
}

// =================================================================================
// 3. TOOL DEFINITIONS
// =================================================================================

/**
 * Tool definition for retrieving component data.
 * This schema tells the AI how and when to use this function.
 */
const getComponentDataDeclaration: any = {
  name: "getComponentData",
  description: "Get a list of PC components from a specific category, with optional filters.",
  parameters: {
    type: "OBJECT",
    properties: {
      category: {
        type: "STRING",
        description: "The category of components to retrieve (e.g., 'graphics_cards', 'processors').",
        enum: ['graphics_cards', 'processors', 'motherboards', 'memory', 'storage', 'power_supplies']
      },
      filter: {
        type: "OBJECT",
        description: "Optional filters to apply.",
        properties: {
          maxPrice: { type: "NUMBER", description: "Maximum price." },
          minPrice: { type: "NUMBER", description: "Minimum price." },
          brand: { type: "STRING", description: "Component brand." }
        }
      }
    },
    required: ["category"]
  }
};

/**
 * Tool definition for recommending a full gaming build.
 * This schema tells the AI how and when to use this function.
 */
const recommendGamingBuildDeclaration: any = {
  name: "recommendGamingBuild",
  description: "Recommends a complete gaming PC build based on budget or performance tier.",
  parameters: {
    type: "OBJECT",
    properties: {
      budget: {
        type: "NUMBER",
        description: "The total budget for the PC build."
      },
      performanceTier: {
        type: "STRING",
        description: "The desired performance tier ('entry', 'mid', 'high-end')."
      }
    }
  }
};

// =================================================================================
// 4. AI AGENT CLASS
// =================================================================================

class PcBuilderAI {
  private model: any;
  private dataSources: DataSources | null = null;
  private functions: { [key: string]: Function };

  constructor() {
    console.log('🤖 Initializing PcBuilderAI...');
    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
      tools: [{ functionDeclarations: [getComponentDataDeclaration, recommendGamingBuildDeclaration] }],
      systemInstruction: SYSTEM_PROMPT,
    });
    
    // Define the available functions that the AI can call.
    this.functions = {
      getComponentData: this.getComponentData.bind(this),
      recommendGamingBuild: this.recommendGamingBuild.bind(this),
    };

    console.log('✅ AI model initialized successfully with tools and system prompt');
  }

  // --- Public Methods ---

  /**
   * Loads all component data from JSON files into memory.
   * This is a one-time operation when the agent starts.
   */
  async loadData(): Promise<void> {
    console.log('📊 Loading component data...');
    try {
      const startTime = Date.now();
      
      const fetchJson = (url: string) => fetch(url).then(r => r.json());

      const [
        graphicsCards, processors, motherboards, memory, storage, powerSupplies
      ] = await Promise.all([
        fetchJson('/data/graphics-cards.json'),
        fetchJson('/data/processors.json'),
        fetchJson('/data/motherboards.json'),
        fetchJson('/data/memory.json'),
        fetchJson('/data/storage.json'),
        fetchJson('/data/power-supplies.json'),
      ]);

      this.dataSources = {
        graphics_cards: graphicsCards.graphics_cards,
        processors: processors.processors,
        motherboards: motherboards.motherboards,
        memory: memory.memory,
        storage: storage.storage,
        power_supplies: powerSupplies.power_supplies
      };

      console.log(`✅ Data loaded successfully in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('❌ Error loading data:', error);
      throw new Error('Failed to load component data');
    }
  }
  
  /**
   * Processes a user's message, interacts with the Gemini model, and handles tool calls.
   * @param message The user's input text.
   * @param history The previous conversation history.
   * @returns A promise that resolves to the AI's response and the updated history.
   */
  async sendMessage(message: string, history: any[] = []): Promise<SendMessageResult> {
    try {
      console.log('🗣️ USER MESSAGE:', message);
      
      const conversationHistory: any[] = [...history, { role: "user", parts: [{ text: message }] }];

      const result = await this.model.generateContent({ contents: conversationHistory });
      const response = result.response;
      
      // Check if the model requested to call any functions.
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        // If so, execute the functions and get the results.
        const modelResponseWithTools = response.candidates?.[0]?.content;
        if (!modelResponseWithTools) {
          throw new Error("Model did not return a response with tool calls.");
        }
        
        const historyWithToolRequest = [...conversationHistory, modelResponseWithTools];
        const { toolResponseHistory, finalResponse } = await this.handleToolCalls(functionCalls, historyWithToolRequest);
        
        return { response: finalResponse, history: toolResponseHistory };
      } else {
        // If not, just return the model's text response.
        const finalResponse = response.text();
        console.log('🤖 LLM RESPONSE:', finalResponse);
        const updatedHistory = response.candidates?.[0]?.content ? [...conversationHistory, response.candidates[0].content] : conversationHistory;
        return { response: finalResponse, history: updatedHistory };
      }

    } catch (error) {
      console.error('❌ ERROR in sendMessage:', error);
      const errorResponse = '❌ **Error**: Sorry, I encountered a critical error. Please try again.';
      console.log('🤖 LLM RESPONSE:', errorResponse);
      return { response: errorResponse, history: [] };
    }
  }

  // --- Private Helper Methods ---

  /**
   * Executes the tool functions requested by the model.
   * @param functionCalls An array of function calls from the model.
   * @param conversationHistory The current conversation history.
   * @returns A promise that resolves to the updated history and the final AI response.
   */
  private async handleToolCalls(functionCalls: any[], conversationHistory: any[]): Promise<{ toolResponseHistory: any[], finalResponse: string }> {
    console.log(`🔧 AI requesting ${functionCalls.length} tool(s):`, functionCalls.map(c => c.name));
    
    // Execute all function calls in parallel
    const toolExecutionPromises = functionCalls.map(call => this.executeTool(call));
    const toolResults = await Promise.all(toolExecutionPromises);

    // Add the results of the tool executions to the history
    const historyWithToolResults = [...conversationHistory];
    toolResults.forEach(result => {
      historyWithToolResults.push({ role: "tool", parts: [result] });
    });
    
    // Send the tool results back to the model to get a final, natural language response.
    const finalResult = await this.model.generateContent({ contents: historyWithToolResults });
    const finalResponse = finalResult.response.text();

    console.log('🤖 LLM RESPONSE (after tool use):', finalResponse);

    // Add the final AI response to the history
    const finalHistory = finalResult.response.candidates?.[0]?.content ? [...historyWithToolResults, finalResult.response.candidates[0].content] : historyWithToolResults;
    
    return { toolResponseHistory: finalHistory, finalResponse };
  }

  /**
   * Executes a single tool function and returns its result as a Part.
   * @param call The function call to execute.
   * @returns A promise that resolves to a Part containing the function's response.
   */
  private async executeTool(call: any): Promise<any> {
    const func = this.functions[call.name];
    console.log(`  > Executing: ${call.name}`, call.args);

    let result: any;
    if (func) {
      result = await func(call.args);
    } else {
      result = { error: `Function ${call.name} not found.` };
    }
    
    console.log(`  < Output of ${call.name}:`, result);

    return {
      functionResponse: {
        name: call.name,
        response: result,
      }
    };
  }

  // --- Tool Implementations ---

  /**
   * Tool: Gets a list of PC components.
   */
  private getComponentData(args: GetComponentDataArgs): Component[] {
    if (!this.dataSources) throw new Error('Data sources not loaded');
    const { category, filter } = args;
    
    let components = this.dataSources[category] || [];
    
    if (filter) {
      return components.filter(c => 
        (!filter.brand || c.brand.toLowerCase() === filter.brand.toLowerCase()) &&
        (!filter.maxPrice || c.price <= filter.maxPrice) &&
        (!filter.minPrice || c.price >= filter.minPrice)
      );
    }
    return components;
  }

  /**
   * Tool: Recommends a complete gaming PC build.
   */
  private recommendGamingBuild(args: RecommendGamingBuildArgs): any {
    if (!this.dataSources) throw new Error("Data sources not loaded");
    const { budget, performanceTier } = args;

    const determinedTier = performanceTier || this.getTierFromBudget(budget);
    
    const build = {
      gpu: this.getTieredComponent('graphics_cards', determinedTier),
      cpu: this.getTieredComponent('processors', determinedTier),
      motherboard: this.getTieredComponent('motherboards', determinedTier),
      ram: this.getTieredComponent('memory', determinedTier),
      storage: this.getTieredComponent('storage', determinedTier),
      psu: this.getTieredComponent('power_supplies', determinedTier),
    };

    const totalCost = Object.values(build).reduce((acc, comp) => acc + (comp?.price || 0), 0);
    return { tier: determinedTier, build, totalCost };
  }

  /**
   * Helper for recommendGamingBuild: Selects a component based on tier.
   */
  private getTieredComponent(category: keyof DataSources, tier: 'high-end' | 'mid' | 'entry'): Component | null {
    const components = this.dataSources![category];
    if (!components || components.length === 0) return null;
    
    switch (tier) {
      case 'high-end': return components[0]; // Assumes data is sorted best to worst
      case 'mid': return components[Math.floor(components.length / 2)] || components[0];
      case 'entry': return components[components.length - 1];
      default: return components[0];
    }
  }

  /**
   * Helper for recommendGamingBuild: Determines performance tier from a budget.
   */
  private getTierFromBudget(budget?: number): 'entry' | 'mid' | 'high-end' {
    if (!budget) return 'mid'; // Default to mid-tier if no budget is provided
    if (budget < 1200) return 'entry';
    if (budget <= 2000) return 'mid';
    return 'high-end';
  }
}

export default PcBuilderAI; 