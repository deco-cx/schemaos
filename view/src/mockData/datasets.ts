/**
 * Mock datasets for various integrations
 * These simulate real-world data that would flow through SchemaOS
 */

// Helper function to generate date ranges
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Shopify Orders - E-commerce order management
export const MOCK_SHOPIFY_ORDERS = Array.from({ length: 237 }).map((_, i) => ({
  id: `#ORD-${String(10000 + i).padStart(5, '0')}`,
  createdAt: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  updatedAt: randomDate(new Date('2023-06-01'), new Date()).toISOString(),
  customer: {
    name: ['Sarah Johnson', 'Mike Chen', 'Emma Davis', 'Carlos Rodriguez', 'Lisa Wang'][i % 5],
    email: ['sarah.j@email.com', 'mike.c@email.com', 'emma.d@email.com', 'carlos.r@email.com', 'lisa.w@email.com'][i % 5],
    customerId: `CUST-${String(1000 + (i % 5)).padStart(4, '0')}`,
  },
  status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'][i % 6],
  fulfillmentStatus: ['unfulfilled', 'partial', 'fulfilled'][i % 3],
  paymentStatus: ['pending', 'paid', 'partially_paid', 'refunded'][i % 4],
  items: [
    {
      name: ['Premium Widget', 'Standard Gadget', 'Deluxe Component', 'Basic Tool'][i % 4],
      quantity: Math.floor(Math.random() * 5) + 1,
      price: (Math.random() * 100 + 20).toFixed(2),
      sku: `SKU-${String(i % 100).padStart(3, '0')}`,
    }
  ],
  totalPrice: (Math.random() * 500 + 50).toFixed(2),
  currency: 'USD',
  shippingAddress: {
    city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
    state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
    country: 'US',
  },
  tags: ['vip', 'repeat-customer', 'high-value', 'new-customer', 'promotional'][i % 5],
}));

// Customer CRM - Customer relationship management
export const MOCK_CRM_CUSTOMERS = Array.from({ length: 512 }).map((_, i) => ({
  id: `CRM-${String(100000 + i).padStart(6, '0')}`,
  firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Robert', 'Olivia'][i % 8],
  lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][i % 8],
  email: `user${i}@example.com`,
  phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
  company: ['Tech Corp', 'Finance Ltd', 'Retail Inc', 'Healthcare Co', 'Manufacturing LLC', null][i % 6],
  status: ['active', 'inactive', 'prospect', 'lead', 'churned'][i % 5],
  segment: ['enterprise', 'mid-market', 'small-business', 'startup'][i % 4],
  lifetime_value: (Math.random() * 50000 + 1000).toFixed(2),
  created_date: randomDate(new Date('2020-01-01'), new Date()).toISOString(),
  last_interaction: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  lead_score: Math.floor(Math.random() * 100),
  deals_count: Math.floor(Math.random() * 20),
  support_tickets: Math.floor(Math.random() * 50),
  tags: [
    ['high-value', 'at-risk'],
    ['engaged', 'champion'],
    ['decision-maker'],
    ['technical-contact', 'billing-contact'],
    []
  ][i % 5],
  industry: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Education', 'Manufacturing'][i % 6],
}));

// Inventory Management - Stock and SKU tracking
export const MOCK_INVENTORY_ITEMS = Array.from({ length: 324 }).map((_, i) => ({
  sku: `SKU-${String(1000 + i).padStart(4, '0')}`,
  name: [
    'Wireless Bluetooth Headphones Pro Max',
    'Smart Home Security Camera 4K',
    'Ergonomic Office Chair Deluxe',
    'Portable SSD Drive 2TB',
    'Gaming Keyboard RGB Mechanical',
    'Yoga Mat Premium Non-Slip',
    'Coffee Maker Espresso Pro',
    'Running Shoes Ultra Comfort'
  ][i % 8],
  category: ['Electronics', 'Furniture', 'Sports', 'Home & Kitchen', 'Accessories'][i % 5],
  subcategory: ['Audio', 'Storage', 'Fitness', 'Appliances', 'Computer Peripherals'][i % 5],
  quantity_on_hand: Math.floor(Math.random() * 1000),
  quantity_available: Math.floor(Math.random() * 800),
  quantity_reserved: Math.floor(Math.random() * 200),
  reorder_point: Math.floor(Math.random() * 100) + 50,
  reorder_quantity: Math.floor(Math.random() * 500) + 100,
  unit_cost: (Math.random() * 100 + 10).toFixed(2),
  retail_price: (Math.random() * 200 + 50).toFixed(2),
  location: {
    warehouse: ['Warehouse A', 'Warehouse B', 'Warehouse C'][i % 3],
    zone: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][i % 6],
    shelf: `${Math.floor(i / 10) + 1}-${(i % 10) + 1}`,
  },
  supplier: ['Global Supplies Inc', 'Premium Goods Co', 'Quick Ship Ltd', 'Direct Source LLC'][i % 4],
  last_restocked: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  status: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued', 'pre_order'][i % 5],
  weight_kg: (Math.random() * 10 + 0.1).toFixed(2),
  dimensions_cm: {
    length: Math.floor(Math.random() * 50) + 10,
    width: Math.floor(Math.random() * 40) + 10,
    height: Math.floor(Math.random() * 30) + 5,
  },
}));

// Analytics Events - User behavior tracking
export const MOCK_ANALYTICS_EVENTS = Array.from({ length: 1843 }).map((_, i) => ({
  event_id: `evt_${Date.now()}_${i}`,
  timestamp: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
  user_id: `user_${Math.floor(Math.random() * 1000)}`,
  session_id: `session_${Math.floor(i / 10)}`,
  event_type: ['page_view', 'click', 'form_submit', 'purchase', 'signup', 'video_play', 'download'][i % 7],
  event_category: ['engagement', 'conversion', 'navigation', 'interaction'][i % 4],
  page_url: [
    '/home',
    '/products',
    '/products/detail',
    '/checkout',
    '/about',
    '/contact',
    '/blog/article-1'
  ][i % 7],
  referrer: ['google.com', 'facebook.com', 'direct', 'email', 'twitter.com', 'linkedin.com'][i % 6],
  device: {
    type: ['desktop', 'mobile', 'tablet'][i % 3],
    os: ['Windows', 'macOS', 'iOS', 'Android', 'Linux'][i % 5],
    browser: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Mobile Safari'][i % 5],
  },
  location: {
    country: ['US', 'UK', 'CA', 'AU', 'DE', 'FR', 'JP'][i % 7],
    city: ['New York', 'London', 'Toronto', 'Sydney', 'Berlin', 'Paris', 'Tokyo'][i % 7],
  },
  properties: {
    button_text: ['Buy Now', 'Learn More', 'Sign Up', 'Download'][i % 4],
    time_on_page: Math.floor(Math.random() * 300) + 10,
    scroll_depth: Math.floor(Math.random() * 100),
    form_field: ['email', 'name', 'phone', 'message'][i % 4],
  },
  conversion_value: i % 10 === 0 ? (Math.random() * 500 + 50).toFixed(2) : null,
}));

// Support Tickets - Customer service management
export const MOCK_SUPPORT_TICKETS = Array.from({ length: 428 }).map((_, i) => ({
  ticket_id: `TICK-${String(20000 + i).padStart(5, '0')}`,
  created_at: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  updated_at: randomDate(new Date('2023-06-01'), new Date()).toISOString(),
  customer: {
    name: ['Alex Morgan', 'Jordan Lee', 'Casey Smith', 'Riley Johnson', 'Quinn Davis'][i % 5],
    email: `customer${i}@email.com`,
    account_type: ['free', 'basic', 'pro', 'enterprise'][i % 4],
  },
  subject: [
    'Cannot access my account',
    'Billing question about recent charge',
    'Feature request: Dark mode',
    'Bug report: Export function not working',
    'How do I integrate with Zapier?',
    'Performance issues with large datasets',
    'Request for API documentation',
    'Account upgrade inquiry'
  ][i % 8],
  status: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'][i % 5],
  priority: ['low', 'medium', 'high', 'urgent'][i % 4],
  category: ['technical', 'billing', 'feature_request', 'bug', 'account', 'integration'][i % 6],
  assigned_to: ['Sarah T.', 'Mike R.', 'Emma K.', 'David L.', 'Unassigned'][i % 5],
  resolution_time_hours: i % 5 === 4 ? Math.floor(Math.random() * 72) + 1 : null,
  satisfaction_rating: i % 5 === 4 ? Math.floor(Math.random() * 2) + 4 : null,
  messages_count: Math.floor(Math.random() * 10) + 1,
  tags: [
    ['vip-customer'],
    ['urgent', 'escalated'],
    ['bug', 'confirmed'],
    ['feature-request', 'under-review'],
    []
  ][i % 5],
  channel: ['email', 'chat', 'phone', 'social_media'][i % 4],
}));

// Stripe Payments - Payment processing
export const MOCK_STRIPE_PAYMENTS = Array.from({ length: 892 }).map((_, i) => ({
  id: `pi_${Math.random().toString(36).substr(2, 9)}`,
  amount: Math.floor(Math.random() * 10000) + 1000, // cents
  currency: ['usd', 'eur', 'gbp', 'cad'][i % 4],
  status: ['succeeded', 'processing', 'requires_payment_method', 'requires_confirmation', 'canceled'][i % 5],
  description: ['Subscription payment', 'One-time purchase', 'Invoice payment', 'Marketplace payout'][i % 4],
  created: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  customer: `cus_${Math.random().toString(36).substr(2, 9)}`,
  metadata: {
    orderId: `#ORD-${String(10000 + i).padStart(5, '0')}`,
    invoiceId: i % 3 === 0 ? `INV-${String(1000 + i).padStart(4, '0')}` : null,
  },
}));

// Mailchimp Campaigns - Email marketing
export const MOCK_MAILCHIMP_CAMPAIGNS = Array.from({ length: 156 }).map((_, i) => ({
  id: `camp_${Math.random().toString(36).substr(2, 9)}`,
  name: ['Summer Sale', 'Product Launch', 'Newsletter', 'Holiday Special', 'Welcome Series'][i % 5] + ` - ${new Date(2023, i % 12, 1).toLocaleDateString('en-US', { month: 'short' })}`,
  status: ['sent', 'scheduled', 'draft', 'paused'][i % 4],
  sentCount: Math.floor(Math.random() * 50000) + 1000,
  openRate: (Math.random() * 0.4 + 0.1), // 10-50%
  clickRate: (Math.random() * 0.1 + 0.02), // 2-12%
  listId: `list_${i % 3}`,
  sendTime: randomDate(new Date('2023-01-01'), new Date()).toISOString(),
  subject: ['Don\'t miss out!', 'New arrivals just for you', 'Your weekly update', 'Special offer inside', 'We miss you!'][i % 5],
}));

// Dataset metadata for dynamic loading
export const DATASET_METADATA = {
  'shopify.orders': {
    data: MOCK_SHOPIFY_ORDERS,
    title: 'Shopify Orders',
    description: 'E-commerce order management with customer details and fulfillment status',
    icon: '🛍️',
  },
  'crm.customers': {
    data: MOCK_CRM_CUSTOMERS,
    title: 'CRM Customers',
    description: 'Customer relationship data with segments, scores, and interaction history',
    icon: '👥',
  },
  'inventory.items': {
    data: MOCK_INVENTORY_ITEMS,
    title: 'Inventory Items',
    description: 'Stock management with SKUs, quantities, and warehouse locations',
    icon: '📦',
  },
  'analytics.events': {
    data: MOCK_ANALYTICS_EVENTS,
    title: 'Analytics Events',
    description: 'User behavior tracking with device, location, and conversion data',
    icon: '📊',
  },
  'support.tickets': {
    data: MOCK_SUPPORT_TICKETS,
    title: 'Support Tickets',
    description: 'Customer service tickets with priority, status, and resolution tracking',
    icon: '🎫',
  },
  'stripe.payments': {
    data: MOCK_STRIPE_PAYMENTS,
    title: 'Stripe Payments',
    description: 'Payment processing with status tracking and metadata',
    icon: '💳',
  },
  'mailchimp.campaigns': {
    data: MOCK_MAILCHIMP_CAMPAIGNS,
    title: 'Email Campaigns',
    description: 'Email marketing campaigns with performance metrics',
    icon: '📧',
  },
};

// Export a simplified datasets object for easier access
export const datasets = {
  shopify: {
    orders: MOCK_SHOPIFY_ORDERS.map((order) => ({
      orderNumber: order.id,
      customerName: order.customer.name,
      email: order.customer.email,
      total: order.totalPrice,
      status: order.status,
      date: order.createdAt,
      items: order.items.length,
    })),
  },
  crm: {
    customers: MOCK_CRM_CUSTOMERS.map((customer) => ({
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      segment: customer.segment,
      score: customer.lead_score,
      totalSpent: parseFloat(customer.lifetime_value.replace(/[$,]/g, '')),
      lastContact: customer.last_interaction,
    })),
  },
  analytics: {
    events: MOCK_ANALYTICS_EVENTS.map((event) => ({
      id: event.event_id,
      eventType: event.event_type,
      userId: event.user_id,
      timestamp: event.timestamp,
      value: event.properties.button_text || event.conversion_value || 0,
      duration: event.properties.time_on_page,
      url: event.page_url,
    })),
  },
  stripe: {
    payments: MOCK_STRIPE_PAYMENTS.map((payment) => ({
      id: payment.id,
      amount: payment.amount / 100, // Convert cents to dollars
      currency: payment.currency.toUpperCase(),
      status: payment.status,
      description: payment.description,
      created: payment.created,
    })),
  },
  mailchimp: {
    campaigns: MOCK_MAILCHIMP_CAMPAIGNS.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      sentCount: campaign.sentCount,
      openRate: (campaign.openRate * 100).toFixed(1),
      clickRate: (campaign.clickRate * 100).toFixed(1),
      sendTime: campaign.sendTime,
    })),
  },
}; 