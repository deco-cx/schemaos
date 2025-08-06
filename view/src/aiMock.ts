import { COMMON_FIELD_PATTERNS } from './mockData';
import type { Field } from './store';

// Simulated AI delay
const AI_RESPONSE_DELAY = 1500;

interface AISuggestion {
  fields: Field[];
  reasoning?: string;
}

// Enhanced AI that analyzes table names more intelligently
export async function fakeAI(tableName: string): Promise<AISuggestion> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const lowerName = tableName.toLowerCase();
      let suggestedFields: Field[] = [];
      let reasoning = '';

      // More intelligent pattern matching
      const patterns = [
        { keywords: ['order', 'pedido', 'compra', 'purchase'], pattern: 'order' },
        { keywords: ['product', 'produto', 'item', 'merchandise'], pattern: 'product' },
        { keywords: ['customer', 'cliente', 'buyer', 'purchaser'], pattern: 'customer' },
        { keywords: ['user', 'usuario', 'account', 'member', 'pessoa'], pattern: 'user' },
        { keywords: ['payment', 'pagamento', 'transaction', 'billing'], pattern: 'payment' },
        { keywords: ['contact', 'contato', 'lead', 'prospect'], pattern: 'contact' },
      ];

      let matchedPattern = null;
      
      // Find the best pattern match
      for (const pattern of patterns) {
        if (pattern.keywords.some(keyword => lowerName.includes(keyword))) {
          matchedPattern = pattern.pattern;
          break;
        }
      }

      if (matchedPattern && COMMON_FIELD_PATTERNS[matchedPattern]) {
        suggestedFields = COMMON_FIELD_PATTERNS[matchedPattern].map(field => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: field.name,
          type: field.type
        }));
        
        const patternDescriptions: Record<string, string> = {
          order: 'e-commerce orders with payment and fulfillment tracking',
          product: 'catalog items with inventory, pricing, and SEO fields',
          customer: 'customer profiles with marketing preferences and purchase history',
          user: 'user accounts with authentication and profile management',
          payment: 'payment transactions with status tracking and metadata',
          contact: 'CRM contacts with lead scoring and lifecycle management'
        };
        
        reasoning = `Analisando "${tableName}", identifiquei um padrão de ${patternDescriptions[matchedPattern]}. Sugeri campos baseados nas melhores práticas do Shopify, Stripe e HubSpot.`;
      } else {
        // Intelligent fallback based on common e-commerce/SaaS patterns
        const baseFields = [
          { name: 'id', type: 'string' },
          { name: 'created_at', type: 'datetime' },
          { name: 'updated_at', type: 'datetime' }
        ];

        // Add context-specific fields based on name hints
        const contextFields = [];
        
        if (lowerName.includes('email') || lowerName.includes('mail')) {
          contextFields.push({ name: 'email', type: 'email' });
          contextFields.push({ name: 'subject', type: 'string' });
          contextFields.push({ name: 'content', type: 'string' });
          contextFields.push({ name: 'status', type: 'enum' });
        } else if (lowerName.includes('inventory') || lowerName.includes('stock')) {
          contextFields.push({ name: 'sku', type: 'string' });
          contextFields.push({ name: 'quantity', type: 'number' });
          contextFields.push({ name: 'location', type: 'string' });
          contextFields.push({ name: 'reserved', type: 'number' });
        } else if (lowerName.includes('shipping') || lowerName.includes('delivery')) {
          contextFields.push({ name: 'tracking_number', type: 'string' });
          contextFields.push({ name: 'carrier', type: 'string' });
          contextFields.push({ name: 'status', type: 'enum' });
          contextFields.push({ name: 'estimated_delivery', type: 'date' });
        } else if (lowerName.includes('review') || lowerName.includes('rating')) {
          contextFields.push({ name: 'rating', type: 'number' });
          contextFields.push({ name: 'title', type: 'string' });
          contextFields.push({ name: 'content', type: 'string' });
          contextFields.push({ name: 'verified_purchase', type: 'boolean' });
        } else {
          // Generic business entity fields
          contextFields.push({ name: 'name', type: 'string' });
          contextFields.push({ name: 'description', type: 'string' });
          contextFields.push({ name: 'status', type: 'enum' });
          contextFields.push({ name: 'tags', type: 'string' });
        }

        suggestedFields = [...baseFields, ...contextFields].map(field => ({
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: field.name,
          type: field.type
        }));
        
        reasoning = `Analisando "${tableName}", criei uma estrutura base com campos comuns para entidades de negócio, incluindo identificadores únicos, timestamps e campos específicos do contexto.`;
      }

      resolve({
        fields: suggestedFields,
        reasoning
      });
    }, AI_RESPONSE_DELAY);
  });
}

// Enhanced relationship suggestion with better heuristics
export async function suggestRelationships(sourceTable: string, targetTable: string): Promise<{
  label: '1-1' | '1-N' | 'N-N';
  reasoning: string;
}> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const source = sourceTable.toLowerCase();
      const target = targetTable.toLowerCase();

      // Enhanced relationship detection
      const relationshipRules = [
        // 1-1 Relationships
        { 
          patterns: [
            ['user', 'profile'], ['customer', 'billing'], ['order', 'payment'],
            ['product', 'inventory'], ['account', 'settings']
          ],
          type: '1-1' as const,
          reasoning: 'Relação um-para-um típica onde cada registro tem uma correspondência única'
        },
        
        // 1-N Relationships
        { 
          patterns: [
            ['customer', 'order'], ['user', 'order'], ['product', 'review'],
            ['category', 'product'], ['brand', 'product'], ['customer', 'address'],
            ['order', 'item'], ['invoice', 'item'], ['customer', 'payment']
          ],
          type: '1-N' as const,
          reasoning: 'Relação um-para-muitos onde um registro pode ter múltiplas referências'
        },
        
        // N-N Relationships
        { 
          patterns: [
            ['product', 'category'], ['user', 'role'], ['order', 'discount'],
            ['product', 'tag'], ['customer', 'segment'], ['product', 'collection']
          ],
          type: 'N-N' as const,
          reasoning: 'Relação muitos-para-muitos onde registros podem ter múltiplas associações bidirecionais'
        }
      ];

      // Check for exact pattern matches
      for (const rule of relationshipRules) {
        for (const [first, second] of rule.patterns) {
          if ((source.includes(first) && target.includes(second)) ||
              (source.includes(second) && target.includes(first))) {
            return resolve({
              label: rule.type,
              reasoning: rule.reasoning + ` (${first} ↔ ${second})`
            });
          }
        }
      }

      // Heuristic fallbacks
      if (source.includes('item') || target.includes('item') ||
          source.includes('line') || target.includes('line')) {
        resolve({
          label: '1-N',
          reasoning: 'Itens geralmente pertencem a uma entidade pai (pedido, fatura, etc.)'
        });
      } else if ((source.includes('customer') || source.includes('user')) && 
                 (target.includes('order') || target.includes('purchase'))) {
        resolve({
          label: '1-N',
          reasoning: 'Clientes podem ter múltiplos pedidos ao longo do tempo'
        });
      } else if (source.includes('category') || target.includes('category') ||
                 source.includes('tag') || target.includes('tag')) {
        resolve({
          label: 'N-N',
          reasoning: 'Categorias e tags geralmente têm relacionamentos muitos-para-muitos'
        });
      } else {
        // Default intelligent guess
        resolve({
          label: '1-N',
          reasoning: 'Relação um-para-muitos é o padrão mais comum em sistemas de e-commerce e SaaS'
        });
      }
    }, 500);
  });
} 