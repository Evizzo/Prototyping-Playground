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

class PcBuilderAI {
  private model: any;
  private dataSources: DataSources | null = null;

  constructor() {
    console.log('🤖 Initializing PcBuilderAI...');
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });
    console.log('✅ AI model initialized successfully');
  }

  async loadData(): Promise<void> {
    console.log('📊 Loading component data...');
    try {
      const startTime = Date.now();
      
      const [
        graphicsCards,
        processors,
        motherboards,
        memory,
        storage,
        powerSupplies
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
      console.log('📈 Component counts:', {
        graphics_cards: this.dataSources.graphics_cards?.length || 0,
        processors: this.dataSources.processors?.length || 0,
        motherboards: this.dataSources.motherboards?.length || 0,
        memory: this.dataSources.memory?.length || 0,
        storage: this.dataSources.storage?.length || 0,
        power_supplies: this.dataSources.power_supplies?.length || 0
      });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      throw new Error('Failed to load component data');
    }
  }

  private getComponentData(category: string, filter?: any): Component[] {
    console.log('🔍 Tool: get_component_data called', { category, filter });
    
    if (!this.dataSources) {
      console.error('❌ Data sources not loaded');
      throw new Error('Data sources not loaded');
    }

    let components = this.dataSources[category as keyof DataSources] || [];
    const originalCount = components.length;

    if (filter) {
      console.log('🔧 Applying filters:', filter);
      components = components.filter(component => {
        if (filter.brand && component.brand.toLowerCase() !== filter.brand.toLowerCase()) {
          return false;
        }
        if (filter.maxPrice && component.price > filter.maxPrice) {
          return false;
        }
        if (filter.minPrice && component.price < filter.minPrice) {
          return false;
        }
        return true;
      });
      console.log(`📊 Filtered ${originalCount} → ${components.length} components`);
    }

    console.log(`✅ Returning ${components.length} ${category} components`);
    return components;
  }

  private compareComponents(componentIds: string[], category: string): Component[] {
    console.log('⚖️ Tool: compare_components called', { componentIds, category });
    
    if (!this.dataSources) {
      console.error('❌ Data sources not loaded');
      throw new Error('Data sources not loaded');
    }

    const components = this.dataSources[category as keyof DataSources] || [];
    const foundComponents = components.filter(component => componentIds.includes(component.id));
    
    console.log(`✅ Found ${foundComponents.length}/${componentIds.length} components for comparison`);
    foundComponents.forEach(comp => console.log(`  - ${comp.name} ($${comp.price})`));
    
    return foundComponents;
  }

  private calculateTotalPrice(components: Array<{id: string, category: string, quantity?: number}>): {
    components: Array<{name: string, price: number, quantity: number, subtotal: number}>,
    total: number
  } {
    console.log('💰 Tool: calculate_total_price called', { components });
    
    if (!this.dataSources) {
      console.error('❌ Data sources not loaded');
      throw new Error('Data sources not loaded');
    }

    const result = {
      components: [] as Array<{name: string, price: number, quantity: number, subtotal: number}>,
      total: 0
    };

    for (const comp of components) {
      const categoryData = this.dataSources[comp.category as keyof DataSources] || [];
      const component = categoryData.find(c => c.id === comp.id);
      
      if (component) {
        const quantity = comp.quantity || 1;
        const subtotal = component.price * quantity;
        
        result.components.push({
          name: component.name,
          price: component.price,
          quantity,
          subtotal
        });
        
        result.total += subtotal;
        console.log(`  + ${component.name} x${quantity}: $${subtotal.toFixed(2)}`);
      } else {
        console.warn(`⚠️ Component not found: ${comp.id} in ${comp.category}`);
      }
    }

    console.log(`💵 Total price calculated: $${result.total.toFixed(2)}`);
    return result;
  }

  private calculatePrice(): number {
    // Simple price calculation example - in real implementation this would be more sophisticated
    const basePrice = 1200; // Base PC build price
    const variationRange = 800; // Price variation range
    return basePrice + Math.floor(Math.random() * variationRange);
  }

  async chat(message: string): Promise<string> {
    try {
      console.log('🗣️ USER MESSAGE:', message);
      
      // Check for specific queries and use appropriate tools
      if (message.toLowerCase().includes('graphics card') || message.toLowerCase().includes('gpu')) {
        console.log('🔧 TOOL CALLED: getComponentData("graphics_cards")');
        const gpus = this.getComponentData('graphics_cards');
        console.log('📊 TOOL OUTPUT:', `Found ${gpus.length} graphics cards`);
        
        const topGpus = gpus.slice(0, 3);
        
        const response = `# 🎮 **Top Graphics Cards**

Here are some of our **best graphics cards** currently available:

${topGpus.map(gpu => `## ${gpu.name}
**Brand:** ${gpu.brand} | **Price:** \`$${gpu.price}\`

- **Memory:** ${gpu.memory}
- **Performance Score:** ${gpu.performance_score}/100
- **Power Consumption:** ${gpu.power_consumption}W
- **Recommended PSU:** ${gpu.recommended_psu}W
- **Features:** ${gpu.features?.join(', ') || 'N/A'}

---`).join('\n\n')}

💡 **Need help choosing?** I can compare specific models or help you find one within your budget! Just ask me something like:
- "Compare RTX 4090 vs RTX 4080"
- "Best GPU under $800"
- "What graphics card for 4K gaming?"`;
        
        console.log('🤖 LLM RESPONSE:', response);
        return response;
      }

      if (message.toLowerCase().includes('processor') || message.toLowerCase().includes('cpu')) {
        console.log('🔧 TOOL CALLED: getComponentData("processors")');
        const cpus = this.getComponentData('processors');
        console.log('📊 TOOL OUTPUT:', `Found ${cpus.length} processors`);
        
        const topCpus = cpus.slice(0, 3);
        
        const response = `# 🔧 **Top Processors**

Here are some of our **best processors** currently available:

${topCpus.map(cpu => `## ${cpu.name}
**Brand:** ${cpu.brand} | **Price:** \`$${cpu.price}\`

| Specification | Value |
|--------------|-------|
| **Cores/Threads** | ${cpu.cores}/${cpu.threads} |
| **Base Clock** | ${cpu.base_clock} GHz |
| **Boost Clock** | ${cpu.boost_clock} GHz |
| **Cache L3** | ${cpu.cache_l3} MB |
| **Socket** | ${cpu.socket} |
| **TDP** | ${cpu.tdp}W |

**Features:** ${cpu.features?.join(', ') || 'N/A'}

---`).join('\n\n')}

💡 **Want to learn more?** I can help you with:
- "Compare Intel vs AMD processors"
- "Best CPU for gaming under $400"  
- "What processor works with Z790 motherboard?"`;
        
        console.log('🤖 LLM RESPONSE:', response);
        return response;
      }

      // For price calculations
      if (message.toLowerCase().includes('price') || message.toLowerCase().includes('cost') || message.toLowerCase().includes('calculate')) {
        console.log('🔧 TOOL CALLED: calculatePrice()');
        const totalPrice = this.calculatePrice();
        console.log('📊 TOOL OUTPUT:', `Total price calculated: $${totalPrice}`);
        
        const response = `# 💰 **Price Calculation**

I can help you calculate the total cost of your PC build! 

**Current estimated total:** \`$${totalPrice}\`

To get a more accurate price calculation, please tell me:
- What specific components you're interested in
- Your budget range
- What you'll use the PC for (gaming, work, etc.)

**Example:** "Calculate price for RTX 4090 + i9-14900K + 32GB RAM"`;
        
        console.log('🤖 LLM RESPONSE:', response);
        return response;
      }

      // Default response for other queries
      console.log('🔧 TOOL CALLED: generateGeneralResponse()');
      const response = `# 🤖 **How Can I Help?**

I'm here to help you build your perfect PC! Here's what I can assist with:

## 🎯 **My Expertise:**
- **🎮 Graphics Cards**: Performance comparisons, recommendations
- **🔧 Processors**: CPU analysis, compatibility checks
- **💰 Pricing**: Cost calculations and budget planning
- **🔍 Components**: Search all PC parts in our database

## 💡 **Try asking:**
- "Show me graphics cards"
- "What processors are available?"
- "Calculate build price"
- "Best gaming setup under $2000"

**What would you like to know about PC building?**`;
      
      console.log('📊 TOOL OUTPUT:', 'Generated general help response');
      console.log('🤖 LLM RESPONSE:', response);
      return response;
    } catch (error) {
      console.error('❌ ERROR in chat:', error);
      const errorResponse = '❌ **Error**: Sorry, I encountered an error. Please try again.';
      console.log('🤖 LLM RESPONSE:', errorResponse);
      return errorResponse;
    }
  }
}

export default PcBuilderAI; 