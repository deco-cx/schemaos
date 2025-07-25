import { create } from 'zustand';

export interface DataSourceEntity {
  id: string;
  name: string;
  description?: string;
  fields?: number;
  records?: number;
}

export interface DataSource {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  entities: DataSourceEntity[];
  account?: string;
}

interface DataSourcesState {
  isModalOpen: boolean;
  availableDataSources: DataSource[];
  addedEntities: Set<string>;
  openModal: () => void;
  closeModal: () => void;
  addEntity: (entityId: string) => void;
  addAllEntities: (dataSourceId: string) => void;
  isEntityAdded: (entityId: string) => boolean;
}

// Transform INTEGRATIONS into DataSource format
const dataSourcesFromIntegrations: DataSource[] = [
  {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    color: 'bg-green-500',
    description: 'E-commerce platform data',
    account: 'mystore2',
    entities: [
      { id: 'shopify.orders', name: 'Orders', description: 'Customer orders and transactions', fields: 12, records: 237 },
      { id: 'shopify.products', name: 'Products', description: 'Product catalog and inventory', fields: 8, records: 156 },
      { id: 'shopify.customers', name: 'Customers', description: 'Customer profiles and data', fields: 10, records: 512 },
      { id: 'shopify.inventory', name: 'Inventory', description: 'Stock levels and locations', fields: 6, records: 324 },
    ]
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    icon: '🐘',
    color: 'bg-blue-600',
    description: 'Relational database',
    account: 'prod-db-main',
    entities: [
      { id: 'postgres.users', name: 'Users', description: 'Application users', fields: 15, records: 1843 },
      { id: 'postgres.orders', name: 'Orders', description: 'Order transactions', fields: 18, records: 3421 },
      { id: 'postgres.products', name: 'Products', description: 'Product information', fields: 12, records: 892 },
      { id: 'postgres.analytics', name: 'Analytics', description: 'User behavior data', fields: 20, records: 12453 },
    ]
  },
  {
    id: 'airtable',
    name: 'Airtable',
    icon: '📊',
    color: 'bg-yellow-500',
    description: 'Spreadsheet database',
    account: 'lucis@deco.cx',
    entities: [
      { id: 'airtable.projects', name: 'Projects', description: 'Project management data', fields: 14, records: 89 },
      { id: 'airtable.tasks', name: 'Tasks', description: 'Task tracking', fields: 11, records: 342 },
      { id: 'airtable.team', name: 'Team Members', description: 'Team information', fields: 8, records: 24 },
      { id: 'airtable.clients', name: 'Clients', description: 'Client database', fields: 12, records: 156 },
    ]
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '💬',
    color: 'bg-indigo-600',
    description: 'Chat and community platform',
    account: 'myserver',
    entities: [
      { id: 'discord.messages', name: 'Messages', description: 'Channel messages and conversations', fields: 10, records: 100 },
      { id: 'discord.members', name: 'Members', description: 'Server members and roles', fields: 8, records: 450 },
      { id: 'discord.channels', name: 'Channels', description: 'Server channels and categories', fields: 6, records: 25 },
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    icon: '💳',
    color: 'bg-purple-600',
    description: 'Payment processing',
    account: 'acct_1MqV3x2eZvKYlo2C',
    entities: [
      { id: 'stripe.payments', name: 'Payments', description: 'Payment transactions', fields: 10, records: 892 },
      { id: 'stripe.customers', name: 'Customers', description: 'Customer payment profiles', fields: 8, records: 423 },
      { id: 'stripe.subscriptions', name: 'Subscriptions', description: 'Recurring subscriptions', fields: 12, records: 178 },
      { id: 'stripe.invoices', name: 'Invoices', description: 'Billing invoices', fields: 14, records: 1243 },
    ]
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    icon: '☁️',
    color: 'bg-blue-500',
    description: 'CRM platform',
    account: 'sales-team-org',
    entities: [
      { id: 'crm.customers', name: 'Contacts', description: 'Customer contacts', fields: 16, records: 512 },
      { id: 'crm.leads', name: 'Leads', description: 'Sales leads', fields: 14, records: 234 },
      { id: 'crm.opportunities', name: 'Opportunities', description: 'Sales opportunities', fields: 18, records: 89 },
      { id: 'crm.accounts', name: 'Accounts', description: 'Business accounts', fields: 20, records: 156 },
    ]
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    icon: '📧',
    color: 'bg-yellow-600',
    description: 'Email marketing',
    account: 'marketing@company.com',
    entities: [
      { id: 'mailchimp.campaigns', name: 'Campaigns', description: 'Email campaigns', fields: 12, records: 156 },
      { id: 'mailchimp.lists', name: 'Lists', description: 'Subscriber lists', fields: 8, records: 12 },
      { id: 'mailchimp.subscribers', name: 'Subscribers', description: 'Email subscribers', fields: 10, records: 8934 },
      { id: 'mailchimp.automations', name: 'Automations', description: 'Email automations', fields: 14, records: 23 },
    ]
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    icon: '📈',
    color: 'bg-orange-500',
    description: 'Web analytics',
    account: 'GA4-123456789',
    entities: [
      { id: 'analytics.events', name: 'Events', description: 'User interaction events', fields: 15, records: 1843 },
      { id: 'analytics.pageviews', name: 'Page Views', description: 'Page view data', fields: 12, records: 23421 },
      { id: 'analytics.users', name: 'Users', description: 'User demographics', fields: 18, records: 4532 },
      { id: 'analytics.conversions', name: 'Conversions', description: 'Goal conversions', fields: 10, records: 892 },
    ]
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: '🎯',
    color: 'bg-orange-600',
    description: 'Marketing automation',
    account: 'hub-12345678',
    entities: [
      { id: 'hubspot.contacts', name: 'Contacts', description: 'Marketing contacts', fields: 22, records: 3421 },
      { id: 'hubspot.companies', name: 'Companies', description: 'Company profiles', fields: 18, records: 234 },
      { id: 'hubspot.deals', name: 'Deals', description: 'Sales deals', fields: 16, records: 123 },
      { id: 'hubspot.tickets', name: 'Tickets', description: 'Support tickets', fields: 14, records: 428 },
    ]
  }
];

export const useDataSources = create<DataSourcesState>((set, get) => ({
  isModalOpen: false,
  availableDataSources: dataSourcesFromIntegrations,
  addedEntities: new Set<string>(),
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
  
  addEntity: (entityId: string) => {
    set((state) => ({
      addedEntities: new Set([...state.addedEntities, entityId])
    }));
  },
  
  addAllEntities: (dataSourceId: string) => {
    const dataSource = get().availableDataSources.find(ds => ds.id === dataSourceId);
    if (dataSource) {
      const entityIds = dataSource.entities.map(e => e.id);
      set((state) => ({
        addedEntities: new Set([...state.addedEntities, ...entityIds])
      }));
    }
  },
  
  isEntityAdded: (entityId: string) => {
    return get().addedEntities.has(entityId);
  },
})); 