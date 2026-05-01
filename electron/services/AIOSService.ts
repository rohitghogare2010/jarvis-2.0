import { BaseService } from './BaseService';

interface ConversationContext {
  history: Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  preferences: Record<string, unknown>;
  currentTask?: string;
}

interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, string>;
}

export class AIOSService extends BaseService {
  private conversationContext: ConversationContext = {
    history: [],
    preferences: {},
  };
  private intentPatterns: Map<string, RegExp[]> = new Map();

  constructor() {
    super({ name: 'AIOSService' });
    this.initializeIntentPatterns();
  }

  private initializeIntentPatterns(): void {
    // Greeting patterns
    this.intentPatterns.set('greeting', [
      /^(hi|hello|hey|greetings)/i,
      /^(good morning|good afternoon|good evening)/i,
      /^(howdy|what's up|yo)/i,
    ]);

    // System control patterns
    this.intentPatterns.set('system_control', [
      /^(open|launch|start|run)/i,
      /^(close|quit|exit|stop)/i,
      /^(minimize|maximize)/i,
      /^(restart|reboot)/i,
    ]);

    // Information queries
    this.intentPatterns.set('information', [
      /^(what|how|when|where|why)/i,
      /^(tell me|show me|give me)/i,
      /^(find|search|look up)/i,
    ]);

    // Task execution
    this.intentPatterns.set('task', [
      /^(do|make|create|build|generate)/i,
      /^(calculate|compute|analyze)/i,
      /^(send|email|notify|remind)/i,
    ]);

    // File operations
    this.intentPatterns.set('file_operation', [
      /^(read|write|delete|copy|move)/i,
      /^(save|load|export|import)/i,
    ]);

    // Goodbye patterns
    this.intentPatterns.set('goodbye', [
      /^(bye|goodbye|see you|farewell)/i,
      /^(exit|quit|close)/i,
    ]);
  }

  async initialize(): Promise<void> {
    console.log('[AIOSService] Initializing JARVIS AI core...');
    
    try {
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.markReady();
      console.log('[AIOSService] JARVIS AI core ready');
    } catch (error) {
      this.setError(`Initialization failed: ${(error as Error).message}`);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('[AIOSService] Shutting down...');
    this.conversationContext.history = [];
    this.setStatus('stopped');
    console.log('[AIOSService] Shut down successfully');
  }

  async execute(method: string, args?: unknown[]): Promise<unknown> {
    switch (method) {
      case 'process':
        return this.process(args?.[0] as string);
      case 'getContext':
        return this.conversationContext;
      case 'clearHistory':
        return this.clearHistory();
      case 'setPreference':
        return this.setPreference(args?.[0] as string, args?.[1]);
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  async process(input: string): Promise<{
    text: string;
    intent: string;
    confidence: number;
    suggestions?: string[];
  }> {
    const trimmedInput = input.trim();
    
    // Add to history
    this.conversationContext.history.push({
      role: 'user',
      content: trimmedInput,
      timestamp: Date.now(),
    });

    // Determine intent
    const intentResult = this.analyzeIntent(trimmedInput);

    // Generate response
    const response = this.generateResponse(trimmedInput, intentResult);

    // Add response to history
    this.conversationContext.history.push({
      role: 'assistant',
      content: response.text,
      timestamp: Date.now(),
    });

    // Keep history manageable
    if (this.conversationContext.history.length > 50) {
      this.conversationContext.history = this.conversationContext.history.slice(-50);
    }

    return response;
  }

  private analyzeIntent(input: string): IntentResult {
    let bestIntent = 'unknown';
    let bestConfidence = 0;

    for (const [intent, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          const confidence = 0.8;
          if (confidence > bestConfidence) {
            bestIntent = intent;
            bestConfidence = confidence;
          }
        }
      }
    }

    // Extract entities (simple keyword-based)
    const entities: Record<string, string> = {};
    
    const entityPatterns: Record<string, RegExp> = {
      application: /\b(slack|discord|chrome|vscode|terminal|finder)\b/i,
      time: /\b(\d{1,2}:\d{2}|\d+\s*(minutes?|hours?|seconds?))\b/i,
      file: /\b(\w+\.\w+|\/\S+)\b/i,
    };

    for (const [entity, pattern] of Object.entries(entityPatterns)) {
      const match = input.match(pattern);
      if (match) {
        entities[entity] = match[1] || match[0];
      }
    }

    return {
      intent: bestIntent,
      confidence: bestConfidence || 0.3,
      entities,
    };
  }

  private generateResponse(input: string, intent: IntentResult): {
    text: string;
    intent: string;
    confidence: number;
    suggestions?: string[];
  } {
    const responses: Record<string, string> = {
      greeting: "Hello, sir. I am JARVIS, your personal AI assistant. How may I help you today?",
      system_control: "I understand you want to control system functions. Please specify the application or action you'd like me to perform.",
      information: "I'm here to help. Let me analyze your query and provide the information you need.",
      task: "I'll work on that task for you. Please provide any specific details or parameters.",
      file_operation: "I can help you with file operations. What would you like me to do with the file?",
      goodbye: "Goodbye, sir. I'll be here when you need me. Have a great day!",
      unknown: "I understand your request. Let me process this and provide you with the best response.",
    };

    const baseResponse = responses[intent.intent] || responses.unknown;

    const suggestions = this.generateSuggestions(intent.intent);

    return {
      text: baseResponse,
      intent: intent.intent,
      confidence: intent.confidence,
      suggestions,
    };
  }

  private generateSuggestions(intent: string): string[] {
    const suggestionMap: Record<string, string[]> = {
      greeting: [
        "Check system status",
        "Open applications",
        "Search the web",
      ],
      system_control: [
        "Show all applications",
        "System diagnostics",
        "Quick actions menu",
      ],
      information: [
        "Check weather",
        "View calendar",
        "Search files",
      ],
      task: [
        "Create a reminder",
        "Send a message",
        "Generate a report",
      ],
      file_operation: [
        "Recent files",
        "Open folder",
        "Backup files",
      ],
      goodbye: [
        "End session",
        "Show summary",
        "Lock system",
      ],
    };

    return suggestionMap[intent] || ["Show dashboard", "Open settings", "Help me"];
  }

  private clearHistory(): boolean {
    this.conversationContext.history = [];
    return true;
  }

  private setPreference(key: string, value: unknown): void {
    this.conversationContext.preferences[key] = value;
  }
}