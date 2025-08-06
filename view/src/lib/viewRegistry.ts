/**
 * View Registry System
 * 
 * This system allows registering different view types for different binding capabilities.
 * Each view can specify which capabilities it supports and provide metadata about itself.
 */

export interface ViewDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  requiredCapabilities: string[];
  component?: React.ComponentType<{ data: any }>;
  enabled: boolean;
}

// Default views that come with the system
export const DEFAULT_VIEWS: ViewDefinition[] = [
  {
    id: 'table-view',
    name: 'Table View',
    icon: 'Database',
    description: 'Paginated table with sorting, filtering, and export',
    requiredCapabilities: ['PaginatedList'],
    enabled: true,
  },
  {
    id: 'chart-view',
    name: 'Chart View',
    icon: 'BarChart3',
    description: 'Visualize data trends and patterns',
    requiredCapabilities: ['PaginatedList', 'TimeSeries'],
    enabled: false, // Coming soon
  },
  {
    id: 'kanban-view',
    name: 'Kanban Board',
    icon: 'Columns',
    description: 'Organize items by status in columns',
    requiredCapabilities: ['PaginatedList', 'Assignable'],
    enabled: false, // Coming soon
  },
  {
    id: 'calendar-view',
    name: 'Calendar View',
    icon: 'Calendar',
    description: 'View time-based data in calendar format',
    requiredCapabilities: ['PaginatedList', 'TimeSeries'],
    enabled: false, // Coming soon
  },
  {
    id: 'metrics-view',
    name: 'Metrics Dashboard',
    icon: 'Activity',
    description: 'Key metrics and KPIs at a glance',
    requiredCapabilities: ['PaginatedList'],
    enabled: false, // Coming soon
  },
];

// AI could generate custom views based on data structure
export interface AIGeneratedView extends ViewDefinition {
  generatedFor: string; // Binding ID this was generated for
  prompt: string; // The prompt used to generate this view
  code?: string; // Generated component code
}

/**
 * Get available views for a given set of capabilities
 */
export function getAvailableViews(capabilities: string[]): ViewDefinition[] {
  return DEFAULT_VIEWS.filter(view => 
    view.requiredCapabilities.every(req => capabilities.includes(req))
  );
}

/**
 * Future: AI-generated view suggestions based on data structure
 */
export function suggestCustomViews(
  bindingId: string,
  dataStructure: any,
  existingViews: ViewDefinition[]
): AIGeneratedView[] {
  // This would call an AI service to analyze the data structure
  // and suggest custom visualizations
  
  // Mock example:
  return [
    {
      id: `ai-funnel-${bindingId}`,
      name: 'Conversion Funnel',
      icon: 'Filter',
      description: 'AI detected a conversion flow in your data',
      requiredCapabilities: ['PaginatedList'],
      enabled: false,
      generatedFor: bindingId,
      prompt: 'Create a funnel visualization for e-commerce order status progression',
    },
  ];
} 