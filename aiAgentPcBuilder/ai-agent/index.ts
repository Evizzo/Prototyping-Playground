import { GoogleGenerativeAI } from '@google/generative-ai';

// Get API key from environment variables
const apiKey = import.meta.env?.VITE_GOOGLE_API_KEY || 'your-api-key-here';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

// Data interfaces
interface Component {
  id: string;
  name: string;
  brand: string;
  price: number;
  [key: string]: any;
}

interface DataSources {
  graphics_cards: Component[];
  processors: Component[];
  motherboards: Component[];
  memory: Component[];
  storage: Component[];
  power_supplies: Component[];
}

const getComponentDataDeclaration = {
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

const recommendGamingBuildDeclaration = {
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

class PcBuilderAI {
  private model: any;
  private dataSources: DataSources | null = null;
  
  private functions: any;

  constructor() {
    console.log('🤖 Initializing PcBuilderAI...');
    
    this.functions = {
      getComponentData: (args: { category: string, filter?: any }): Component[] => {
        const { category, filter } = args;
        console.log('🔍 Tool Executing: getComponentData', { category, filter });
        if (!this.dataSources) throw new Error('Data sources not loaded');
        let components = this.dataSources[category as keyof DataSources] || [];
        if (filter) {
          components = components.filter(c => 
            (!filter.brand || c.brand.toLowerCase() === filter.brand.toLowerCase()) &&
            (!filter.maxPrice || c.price <= filter.maxPrice) &&
            (!filter.minPrice || c.price >= filter.minPrice)
          );
        }
        return components;
      },
      recommendGamingBuild: (args: { budget?: number, performanceTier?: 'entry' | 'mid' | 'high-end' }): any => {
        const { budget, performanceTier } = args;
        console.log('🎮 Tool Executing: recommendGamingBuild', { budget, performanceTier });
        if (!this.dataSources) throw new Error("Data sources not loaded");
        const getTieredComponent = (category: keyof DataSources, tier: 'high-end' | 'mid' | 'entry') => {
          const components = this.dataSources![category];
          if (!components || components.length === 0) return null;
          switch (tier) {
            case 'high-end': return components[0];
            case 'mid': return components[Math.floor(components.length / 2)] || components[0];
            case 'entry': return components[components.length - 1];
            default: return components[0];
          }
        };
        const tier = performanceTier || (budget && budget < 1200 ? 'entry' : (budget && budget <= 2000 ? 'mid' : 'high-end'));
        const build = {
          gpu: getTieredComponent('graphics_cards', tier),
          cpu: getTieredComponent('processors', tier),
          motherboard: getTieredComponent('motherboards', tier),
          ram: getTieredComponent('memory', tier),
          storage: getTieredComponent('storage', tier),
          psu: getTieredComponent('power_supplies', tier),
        };
        const totalCost = Object.values(build).reduce((acc, comp) => acc + (comp?.price || 0), 0);
        return { tier, build, totalCost };
      }
    };
    
    // Bind the methods
    this.functions.getComponentData = this.functions.getComponentData.bind(this);
    this.functions.recommendGamingBuild = this.functions.recommendGamingBuild.bind(this);

    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: [{ functionDeclarations: [getComponentDataDeclaration, recommendGamingBuildDeclaration] }] as any,
    });
    
    console.log('✅ AI model initialized successfully with tools');
  }

  async loadData(): Promise<void> {
    console.log('📊 Loading component data...');
    try {
      const startTime = Date.now();
      
      const [
        graphicsCards, processors, motherboards, memory, storage, powerSupplies
      ] = await Promise.all([
        fetch('/data/graphics-cards.json').then(r => r.json()),
        fetch('/data/processors.json').then(r => r.json()),
        fetch('/data/motherboards.json').then(r => r.json()),
        fetch('/data/memory.json').then(r => r.json()),
        fetch('/data/storage.json').then(r => r.json()),
        fetch('/data/power-supplies.json').then(r => r.json())
      ]);

      this.dataSources = {
        graphics_cards: graphicsCards.graphics_cards,
        processors: processors.processors,
        motherboards: motherboards.motherboards,
        memory: memory.memory,
        storage: storage.storage,
        power_supplies: powerSupplies.power_supplies
      };

      const loadTime = Date.now() - startTime;
      console.log('✅ Data loaded successfully in', loadTime, 'ms');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      throw new Error('Failed to load component data');
    }
  }
  
  async sendMessage(message: string, history: any[] = []): Promise<{ response: string, history: any[] }> {
    try {
      console.log('🗣️ USER MESSAGE:', message);
      
      const contents = [...history, { role: "user", parts: [{ text: message }] }];

      const result = await this.model.generateContent({
        contents: contents,
      });

      const response = result.response;
      const calls = response.functionCalls();

      if (calls && calls.length > 0) {
        console.log(`🔧 AI requesting ${calls.length} tool(s):`, calls.map((c: any) => c.name));
        
        contents.push(response.candidates![0].content);

        const toolResponses = await Promise.all(calls.map(async (call: any) => {
          const func = this.functions[call.name];
          const toolResult = func ? await func(call.args) : { error: `Function ${call.name} not found.` };
          
          console.log(`  > Executing: ${call.name}`, call.args);
          console.log(`  < Output of ${call.name}:`, toolResult);
          
          return {
            toolCall: call,
            toolResult: toolResult,
          };
        }));
        
        toolResponses.forEach(toolResponse => {
            contents.push({
                role: "tool",
                parts: [{
                    functionResponse: {
                        name: toolResponse.toolCall.name,
                        response: toolResponse.toolResult,
                    }
                }]
            });
        });

        const finalResult = await this.model.generateContent({ contents });

        const finalResponse = finalResult.response.text();
        console.log('🤖 LLM RESPONSE:', finalResponse);
        
        contents.push(finalResult.response.candidates[0].content);

        return { response: finalResponse, history: contents };

      } else {
        const finalResponse = response.text();
        console.log('🤖 LLM RESPONSE:', finalResponse);
        
        if (response.candidates && response.candidates.length > 0) {
          contents.push(response.candidates[0].content);
        }
        
        return { response: finalResponse, history: contents };
      }

    } catch (error) {
      console.error('❌ ERROR in chat:', error);
      const errorResponse = '❌ **Error**: Sorry, I encountered an error. Please try again.';
      console.log('🤖 LLM RESPONSE:', errorResponse);
      return { response: errorResponse, history: [] };
    }
  }
}

export default PcBuilderAI; 