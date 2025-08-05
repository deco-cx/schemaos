import { create } from 'zustand';
import { SchemaSpec, ParseResult, ValidationError } from './types';
import { parsePrompt } from './parsePrompt';

interface SchemaAIStore {
  // Modal state
  isOpen: boolean;
  currentStep: 'prompt' | 'summary' | 'applying';
  
  // Prompt and parsing
  prompt: string;
  isProcessing: boolean;
  parseResult: ParseResult | null;
  
  // Generated schema
  generatedSchema: SchemaSpec | null;
  validationErrors: ValidationError[];
  
  // Actions
  openModal: () => void;
  closeModal: () => void;
  setPrompt: (prompt: string) => void;
  processPrompt: () => Promise<void>;
  goToSummary: () => void;
  goBackToPrompt: () => void;
  applySchema: () => void;
  reset: () => void;
}

export const useSchemaAI = create<SchemaAIStore>((set, get) => ({
  // Initial state
  isOpen: false,
  currentStep: 'prompt',
  prompt: '',
  isProcessing: false,
  parseResult: null,
  generatedSchema: null,
  validationErrors: [],

  // Actions
  openModal: () => {
    set({
      isOpen: true,
      currentStep: 'prompt',
      prompt: '',
      parseResult: null,
      generatedSchema: null,
      validationErrors: [],
      isProcessing: false
    });
  },

  closeModal: () => {
    set({
      isOpen: false,
      currentStep: 'prompt',
      prompt: '',
      parseResult: null,
      generatedSchema: null,
      validationErrors: [],
      isProcessing: false
    });
  },

  setPrompt: (prompt: string) => {
    set({ prompt });
  },

  processPrompt: async () => {
    const { prompt } = get();
    
    if (!prompt.trim()) {
      return;
    }

    set({ isProcessing: true, parseResult: null });

    try {
      const result = await parsePrompt(prompt);
      
      set({ 
        parseResult: result,
        generatedSchema: result.schema || null,
        validationErrors: result.errors || [],
        isProcessing: false
      });

      // Auto-advance to summary if successful
      if (result.success && result.schema) {
        set({ currentStep: 'summary' });
      }
    } catch (error) {
      console.error('Error processing prompt:', error);
      set({
        parseResult: {
          success: false,
          errors: [{ 
            type: 'error', 
            message: error instanceof Error ? error.message : 'An unexpected error occurred while processing your request.' 
          }]
        },
        isProcessing: false
      });
    }
  },

  goToSummary: () => {
    set({ currentStep: 'summary' });
  },

  goBackToPrompt: () => {
    set({ currentStep: 'prompt' });
  },

  applySchema: () => {
    set({ currentStep: 'applying' });
    // The actual application will be handled by the modal component
    // which will call the schema store's addMany method
  },

  reset: () => {
    set({
      currentStep: 'prompt',
      prompt: '',
      parseResult: null,
      generatedSchema: null,
      validationErrors: [],
      isProcessing: false
    });
  }
}));

// Helper function to get example prompts
export const getExamplePrompts = () => [
  "I need customers with orders. Each customer has name, email, and phone. Orders have total amount, status, and creation date.",
  "Create a blog system with posts, authors, and categories. Posts belong to categories and are written by authors.",
  "E-commerce store with products, categories, and inventory. Products can be in multiple categories.",
  "CRM system with customers, deals, and activities. Customers can have multiple deals, deals have activities.",
  "Project management with projects, tasks, and users. Users can be assigned to multiple projects and tasks."
];