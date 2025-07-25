import type { MockBinding } from './store';

export const MOCK_BINDINGS: MockBinding[] = [
  {
    id: 'shopify.orders',
    provider: 'Shopify',
    capabilities: ['PaginatedList', 'BulkExport'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique order identifier' },
        order_number: { type: 'integer', description: 'Human-readable order number' },
        email: { type: 'string', format: 'email', description: 'Customer email address' },
        created_at: { type: 'string', format: 'date-time', description: 'Order creation timestamp' },
        updated_at: { type: 'string', format: 'date-time', description: 'Order last update timestamp' },
        total_price: { type: 'string', description: 'Total order price in currency format' },
        subtotal_price: { type: 'string', description: 'Subtotal before taxes and shipping' },
        total_tax: { type: 'string', description: 'Total tax amount' },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'], description: 'Order currency' },
        financial_status: { 
          type: 'string', 
          enum: ['authorized', 'paid', 'partially_paid', 'pending', 'voided', 'refunded', 'partially_refunded'],
          description: 'Payment status of the order'
        },
        fulfillment_status: { 
          type: 'string', 
          enum: ['fulfilled', 'partial', 'restocked', 'pending', 'cancelled'],
          description: 'Fulfillment status'
        },
        // Complex expandable objects
        customer: {
          type: 'object',
          description: 'Customer information',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            phone: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            tags: { type: 'string' },
            total_spent: { type: 'string' }
          }
        },
        billing_address: {
          type: 'object',
          description: 'Billing address details',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            address1: { type: 'string' },
            address2: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            country: { type: 'string' },
            zip: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        shipping_address: {
          type: 'object',
          description: 'Shipping address details',
          properties: {
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            address1: { type: 'string' },
            address2: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            country: { type: 'string' },
            zip: { type: 'string' },
            phone: { type: 'string' }
          }
        },
        // Array of complex objects
        line_items: {
          type: 'array',
          description: 'Items in the order',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              product_id: { type: 'string', format: 'uuid' },
              variant_id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              variant_title: { type: 'string' },
              sku: { type: 'string' },
              quantity: { type: 'integer' },
              price: { type: 'string' },
              total_discount: { type: 'string' },
              fulfillment_status: { type: 'string' }
            }
          }
        },
        shipping_lines: {
          type: 'array',
          description: 'Shipping information',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              price: { type: 'string' },
              code: { type: 'string' },
              source: { type: 'string' }
            }
          }
        },
        tax_lines: {
          type: 'array',
          description: 'Tax breakdown',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              price: { type: 'string' },
              rate: { type: 'number' }
            }
          }
        }
      }
    }
  },
  {
    id: 'shopify.products',
    provider: 'Shopify',
    capabilities: ['PaginatedList', 'BulkExport'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique product identifier' },
        title: { type: 'string', description: 'Product title/name' },
        body_html: { type: 'string', description: 'Product description in HTML format' },
        vendor: { type: 'string', description: 'Product vendor/brand name' },
        product_type: { type: 'string', description: 'Product type/category' },
        handle: { type: 'string', description: 'URL handle (slug) for the product' },
        status: { 
          type: 'string', 
          enum: ['active', 'archived', 'draft'],
          description: 'Product publication status'
        },
        published_at: { type: 'string', format: 'date-time', description: 'When product was published' },
        created_at: { type: 'string', format: 'date-time', description: 'Product creation timestamp' },
        updated_at: { type: 'string', format: 'date-time', description: 'Product last update timestamp' },
        published_scope: { type: 'string', enum: ['web', 'global'], description: 'Publishing scope' },
        tags: { 
          type: 'array',
          description: 'Product tags for organization',
          items: {
            type: 'string'
          }
        },
        // Complex expandable arrays
        variants: { 
          type: 'array', 
          description: 'Product variants (different SKUs)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              product_id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              price: { type: 'string' },
              sku: { type: 'string' },
              position: { type: 'integer' },
              inventory_policy: { type: 'string', enum: ['deny', 'continue'] },
              compare_at_price: { type: 'string' },
              fulfillment_service: { type: 'string' },
              inventory_management: { type: 'string' },
              option1: { type: 'string' },
              option2: { type: 'string' },
              option3: { type: 'string' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              taxable: { type: 'boolean' },
              barcode: { type: 'string' },
              grams: { type: 'integer' },
              image_id: { type: 'string', format: 'uuid' },
              weight: { type: 'number' },
              weight_unit: { type: 'string', enum: ['g', 'kg', 'oz', 'lb'] },
              inventory_item_id: { type: 'string', format: 'uuid' },
              inventory_quantity: { type: 'integer' },
              old_inventory_quantity: { type: 'integer' },
              requires_shipping: { type: 'boolean' }
            }
          }
        },
        options: { 
          type: 'array', 
          description: 'Product options (size, color, material, etc.)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              product_id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              position: { type: 'integer' },
              values: { 
                type: 'array',
                description: 'Available option values',
                items: { type: 'string' }
              }
            }
          }
        },
        images: { 
          type: 'array', 
          description: 'Product images gallery',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              product_id: { type: 'string', format: 'uuid' },
              position: { type: 'integer' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              alt: { type: 'string' },
              width: { type: 'integer' },
              height: { type: 'integer' },
              src: { type: 'string', format: 'uri' },
              variant_ids: { 
                type: 'array',
                description: 'Variants this image is associated with',
                items: { type: 'string', format: 'uuid' }
              }
            }
          }
        },
        image: { 
          type: 'object', 
          description: 'Featured/primary product image',
          properties: {
            id: { type: 'string', format: 'uuid' },
            product_id: { type: 'string', format: 'uuid' },
            position: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            alt: { type: 'string' },
            width: { type: 'integer' },
            height: { type: 'integer' },
            src: { type: 'string', format: 'uri' }
          }
        },
        seo_title: { type: 'string', description: 'SEO optimized title' },
        seo_description: { type: 'string', description: 'SEO meta description' },
        template_suffix: { type: 'string', description: 'Custom template suffix for rendering' }
      }
    }
  },
  {
    id: 'shopify.customers',
    provider: 'Shopify',
    capabilities: ['PaginatedList', 'WebhookSource'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid', description: 'Unique customer identifier' },
        email: { type: 'string', format: 'email', description: 'Customer email address' },
        accepts_marketing: { type: 'boolean', description: 'Whether customer accepts marketing emails' },
        created_at: { type: 'string', format: 'date-time', description: 'Customer creation timestamp' },
        updated_at: { type: 'string', format: 'date-time', description: 'Customer last update timestamp' },
        first_name: { type: 'string', description: 'Customer first name' },
        last_name: { type: 'string', description: 'Customer last name' },
        orders_count: { type: 'integer', description: 'Total number of orders placed' },
        state: { 
          type: 'string', 
          enum: ['disabled', 'invited', 'enabled', 'declined'],
          description: 'Customer account state'
        },
        total_spent: { type: 'string', description: 'Total amount spent in currency format' },
        last_order_id: { type: 'string', format: 'uuid', description: 'ID of most recent order' },
        note: { type: 'string', description: 'Internal notes about customer' },
        verified_email: { type: 'boolean', description: 'Whether email address is verified' },
        multipass_identifier: { type: 'string', description: 'Multipass login identifier' },
        tax_exempt: { type: 'boolean', description: 'Whether customer is exempt from taxes' },
        phone: { type: 'string', description: 'Customer phone number' },
        tags: { 
          type: 'array',
          description: 'Customer tags for segmentation',
          items: {
            type: 'string'
          }
        },
        last_order_name: { type: 'string', description: 'Name/number of last order' },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'], description: 'Customer preferred currency' },
        // Complex expandable arrays
        addresses: { 
          type: 'array', 
          description: 'Customer saved addresses',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              customer_id: { type: 'string', format: 'uuid' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              company: { type: 'string' },
              address1: { type: 'string' },
              address2: { type: 'string' },
              city: { type: 'string' },
              province: { type: 'string' },
              country: { type: 'string' },
              zip: { type: 'string' },
              phone: { type: 'string' },
              name: { type: 'string' },
              province_code: { type: 'string' },
              country_code: { type: 'string' },
              country_name: { type: 'string' },
              default: { type: 'boolean' }
            }
          }
        },
        accepts_marketing_updated_at: { type: 'string', format: 'date-time', description: 'When marketing preference was last updated' },
        marketing_opt_in_level: { 
          type: 'string', 
          enum: ['single_opt_in', 'confirmed_opt_in', 'unknown'],
          description: 'Level of marketing consent' 
        },
        tax_exemptions: { 
          type: 'array', 
          description: 'Tax exemption details',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              customer_id: { type: 'string', format: 'uuid' },
              exemption_type: { 
                type: 'string',
                enum: ['federal', 'state', 'provincial', 'local', 'other']
              },
              certificate_number: { type: 'string' },
              issuing_jurisdiction: { type: 'string' },
              valid_from: { type: 'string', format: 'date' },
              valid_until: { type: 'string', format: 'date' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          }
        },
        // Additional complex fields
        default_address: {
          type: 'object',
          description: 'Primary customer address',
          properties: {
            id: { type: 'string', format: 'uuid' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            company: { type: 'string' },
            address1: { type: 'string' },
            address2: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
            country: { type: 'string' },
            zip: { type: 'string' },
            phone: { type: 'string' },
            name: { type: 'string' },
            default: { type: 'boolean' }
          }
        },
        metafields: {
          type: 'array',
          description: 'Custom metadata fields',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              namespace: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' },
              description: { type: 'string' },
              owner_id: { type: 'string', format: 'uuid' },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' },
              owner_resource: { type: 'string' },
              type: { 
                type: 'string',
                enum: ['string', 'integer', 'json_string', 'boolean', 'date', 'rating', 'color', 'weight', 'volume', 'dimension', 'money']
              }
            }
          }
        }
      }
    }
  },
  {
    id: 'stripe.payments',
    provider: 'Stripe',
    capabilities: ['PaginatedList', 'WebhookSource'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Payment Intent ID (pi_...)' },
        object: { type: 'string', enum: ['payment_intent'] },
        amount: { type: 'number', description: 'Amount in cents' },
        amount_capturable: { type: 'number', description: 'Amount that can be captured' },
        amount_received: { type: 'number', description: 'Amount received' },
        application: { type: 'string', nullable: true },
        application_fee_amount: { type: 'number', nullable: true },
        automatic_payment_methods: { type: 'object', nullable: true },
        canceled_at: { type: 'number', nullable: true },
        cancellation_reason: { type: 'string', nullable: true },
        capture_method: { 
          type: 'string', 
          enum: ['automatic', 'manual'],
          description: 'Capture method'
        },
        charges: { type: 'object', description: 'Associated charges' },
        client_secret: { type: 'string', description: 'Client secret for frontend' },
        confirmation_method: { 
          type: 'string', 
          enum: ['automatic', 'manual'],
          description: 'Confirmation method'
        },
        created: { type: 'number', description: 'Created timestamp' },
        currency: { type: 'string', description: 'Three-letter ISO currency code' },
        customer: { type: 'string', description: 'Customer ID (cus_...)' },
        description: { type: 'string', description: 'Payment description' },
        invoice: { type: 'string', nullable: true },
        last_payment_error: { type: 'object', nullable: true },
        latest_charge: { type: 'string', description: 'Latest charge ID' },
        livemode: { type: 'boolean', description: 'Live mode flag' },
        metadata: { type: 'object', description: 'Custom metadata' },
        next_action: { type: 'object', nullable: true },
        on_behalf_of: { type: 'string', nullable: true },
        payment_method: { type: 'string', description: 'Payment method ID' },
        payment_method_options: { type: 'object', description: 'Payment method options' },
        payment_method_types: { type: 'array', description: 'Allowed payment methods' },
        processing: { type: 'object', nullable: true },
        receipt_email: { type: 'string', nullable: true },
        review: { type: 'string', nullable: true },
        setup_future_usage: { type: 'string', nullable: true },
        shipping: { type: 'object', nullable: true },
        statement_descriptor: { type: 'string', nullable: true },
        statement_descriptor_suffix: { type: 'string', nullable: true },
        status: { 
          type: 'string', 
          enum: ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded'],
          description: 'Payment status'
        },
        transfer_data: { type: 'object', nullable: true },
        transfer_group: { type: 'string', nullable: true }
      }
    }
  },
  {
    id: 'hubspot.contacts',
    provider: 'HubSpot',
    capabilities: ['PaginatedList', 'WebhookSource', 'BulkExport'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Contact ID' },
        properties: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email', description: 'Email address' },
            firstname: { type: 'string', description: 'First name' },
            lastname: { type: 'string', description: 'Last name' },
            company: { type: 'string', description: 'Company name' },
            website: { type: 'string', description: 'Website URL' },
            phone: { type: 'string', description: 'Phone number' },
            address: { type: 'string', description: 'Street address' },
            city: { type: 'string', description: 'City' },
            state: { type: 'string', description: 'State/Province' },
            zip: { type: 'string', description: 'Postal code' },
            country: { type: 'string', description: 'Country' },
            jobtitle: { type: 'string', description: 'Job title' },
            lifecyclestage: { 
              type: 'string', 
              enum: ['subscriber', 'lead', 'marketingqualifiedlead', 'salesqualifiedlead', 'opportunity', 'customer', 'evangelist', 'other'],
              description: 'Lifecycle stage'
            },
            hs_lead_status: {
              type: 'string',
              enum: ['NEW', 'OPEN', 'IN_PROGRESS', 'OPEN_DEAL', 'UNQUALIFIED', 'ATTEMPTING_TO_CONTACT', 'CONNECTED', 'BAD_TIMING'],
              description: 'Lead status'
            },
            hubspotscore: { type: 'number', description: 'HubSpot score' },
            hs_analytics_source: { type: 'string', description: 'Original source' },
            hs_analytics_source_data_1: { type: 'string', description: 'Original source drill-down 1' },
            hs_analytics_source_data_2: { type: 'string', description: 'Original source drill-down 2' },
            hs_email_optout: { type: 'boolean', description: 'Opted out of email' },
            hs_legal_basis: { type: 'string', description: 'Legal basis for processing' },
            createdate: { type: 'string', format: 'date-time', description: 'Created date' },
            lastmodifieddate: { type: 'string', format: 'date-time', description: 'Last modified date' },
            hs_object_id: { type: 'string', description: 'Object ID' }
          }
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        archived: { type: 'boolean', description: 'Whether contact is archived' }
      }
    }
  },
  {
    id: 'airtable.records',
    provider: 'Airtable',
    capabilities: ['PaginatedList', 'WebhookSource'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Record ID (rec...)' },
        fields: { 
          type: 'object', 
          description: 'Dynamic fields based on table schema',
          additionalProperties: true
        },
        createdTime: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
      }
    }
  },
  {
    id: 'postgresql.users',
    provider: 'PostgreSQL',
    capabilities: ['PaginatedList'],
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Primary key' },
        uuid: { type: 'string', format: 'uuid', description: 'UUID identifier' },
        email: { type: 'string', format: 'email', description: 'User email' },
        username: { type: 'string', description: 'Username' },
        password_hash: { type: 'string', description: 'Hashed password' },
        first_name: { type: 'string', description: 'First name' },
        last_name: { type: 'string', description: 'Last name' },
        avatar_url: { type: 'string', format: 'uri', nullable: true },
        role: { 
          type: 'string', 
          enum: ['admin', 'user', 'moderator'],
          description: 'User role'
        },
        is_active: { type: 'boolean', description: 'Account active status' },
        is_verified: { type: 'boolean', description: 'Email verified status' },
        last_login_at: { type: 'string', format: 'date-time', nullable: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        deleted_at: { type: 'string', format: 'date-time', nullable: true }
      }
    }
  }
];

// Field type suggestions for different contexts
export const FIELD_TYPE_SUGGESTIONS = [
  'string',
  'number',
  'boolean',
  'date',
  'datetime',
  'email',
  'url',
  'phone',
  'currency',
  'percent',
  'json',
  'array',
  'uuid',
  'reference',
  'enum'
];

// Sample field suggestions based on common patterns (updated with real-world examples)
export const COMMON_FIELD_PATTERNS: Record<string, { name: string; type: string }[]> = {
  user: [
    { name: 'id', type: 'uuid' },
    { name: 'email', type: 'email' },
    { name: 'username', type: 'string' },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'avatar_url', type: 'url' },
    { name: 'role', type: 'enum' },
    { name: 'is_active', type: 'boolean' },
    { name: 'is_verified', type: 'boolean' },
    { name: 'last_login_at', type: 'datetime' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  customer: [
    { name: 'id', type: 'string' },
    { name: 'email', type: 'email' },
    { name: 'first_name', type: 'string' },
    { name: 'last_name', type: 'string' },
    { name: 'phone', type: 'phone' },
    { name: 'total_spent', type: 'currency' },
    { name: 'orders_count', type: 'number' },
    { name: 'accepts_marketing', type: 'boolean' },
    { name: 'state', type: 'enum' },
    { name: 'tags', type: 'string' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  product: [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'vendor', type: 'string' },
    { name: 'product_type', type: 'string' },
    { name: 'handle', type: 'string' },
    { name: 'status', type: 'enum' },
    { name: 'price', type: 'currency' },
    { name: 'compare_at_price', type: 'currency' },
    { name: 'sku', type: 'string' },
    { name: 'inventory_quantity', type: 'number' },
    { name: 'weight', type: 'number' },
    { name: 'tags', type: 'string' },
    { name: 'images', type: 'array' },
    { name: 'seo_title', type: 'string' },
    { name: 'seo_description', type: 'string' },
    { name: 'published_at', type: 'datetime' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  order: [
    { name: 'id', type: 'string' },
    { name: 'order_number', type: 'string' },
    { name: 'name', type: 'string' },
    { name: 'customer_id', type: 'reference' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'phone' },
    { name: 'total_price', type: 'currency' },
    { name: 'subtotal_price', type: 'currency' },
    { name: 'total_tax', type: 'currency' },
    { name: 'currency', type: 'string' },
    { name: 'financial_status', type: 'enum' },
    { name: 'fulfillment_status', type: 'enum' },
    { name: 'line_items', type: 'array' },
    { name: 'shipping_address', type: 'json' },
    { name: 'billing_address', type: 'json' },
    { name: 'tags', type: 'string' },
    { name: 'note', type: 'string' },
    { name: 'gateway', type: 'string' },
    { name: 'test', type: 'boolean' },
    { name: 'processed_at', type: 'datetime' },
    { name: 'created_at', type: 'datetime' },
    { name: 'updated_at', type: 'datetime' }
  ],
  payment: [
    { name: 'id', type: 'string' },
    { name: 'amount', type: 'currency' },
    { name: 'currency', type: 'string' },
    { name: 'status', type: 'enum' },
    { name: 'customer_id', type: 'reference' },
    { name: 'payment_method', type: 'string' },
    { name: 'description', type: 'string' },
    { name: 'receipt_email', type: 'email' },
    { name: 'metadata', type: 'json' },
    { name: 'created', type: 'datetime' }
  ],
  contact: [
    { name: 'id', type: 'string' },
    { name: 'email', type: 'email' },
    { name: 'firstname', type: 'string' },
    { name: 'lastname', type: 'string' },
    { name: 'company', type: 'string' },
    { name: 'jobtitle', type: 'string' },
    { name: 'phone', type: 'phone' },
    { name: 'website', type: 'url' },
    { name: 'lifecyclestage', type: 'enum' },
    { name: 'lead_status', type: 'enum' },
    { name: 'hubspotscore', type: 'number' },
    { name: 'email_optout', type: 'boolean' },
    { name: 'createdate', type: 'datetime' },
    { name: 'lastmodifieddate', type: 'datetime' }
  ]
}; 

export const MockData = {
  nodes: [
    {
      id: '1',
      type: 'object',
      position: { x: 100, y: 100 },
      data: {
        id: '1',
        name: 'Shopify Orders',
        fields: [
          { id: 'f1', name: 'id', type: 'string', required: true },
          { id: 'f2', name: 'customer', type: 'object', required: true },
          { id: 'f3', name: 'status', type: 'string', required: true },
          { id: 'f4', name: 'totalPrice', type: 'number', required: true },
          { id: 'f5', name: 'createdAt', type: 'datetime', required: true },
          { id: 'f6', name: 'items', type: 'array', required: true },
          { id: 'f7', name: 'fulfillmentStatus', type: 'string' },
          { id: 'f8', name: 'paymentStatus', type: 'string' },
          { id: 'f9', name: 'shippingAddress', type: 'object' },
          { id: 'f10', name: 'tags', type: 'array' },
        ],
        binding: {
          id: 'shopify.orders',
          provider: 'shopify',
          capabilities: ['PaginatedList', 'WebhookSource', 'BulkExport'],
        },
      },
    },
    {
      id: '2',
      type: 'object',
      position: { x: 450, y: 100 },
      data: {
        id: '2',
        name: 'CRM Customers',
        fields: [
          { id: 'f1', name: 'id', type: 'string', required: true },
          { id: 'f2', name: 'firstName', type: 'string', required: true },
          { id: 'f3', name: 'lastName', type: 'string', required: true },
          { id: 'f4', name: 'email', type: 'email', required: true },
          { id: 'f5', name: 'company', type: 'string' },
          { id: 'f6', name: 'segment', type: 'enum', required: true },
          { id: 'f7', name: 'lifetime_value', type: 'number' },
          { id: 'f8', name: 'lead_score', type: 'number' },
          { id: 'f9', name: 'created_date', type: 'datetime' },
          { id: 'f10', name: 'tags', type: 'array' },
          { id: 'f11', name: 'industry', type: 'string' },
        ],
        binding: {
          id: 'crm.customers',
          provider: 'salesforce',
          capabilities: ['PaginatedList', 'WebhookSource'],
        },
      },
    },
    {
      id: '3',
      type: 'object',
      position: { x: 800, y: 100 },
      data: {
        id: '3',
        name: 'Inventory Items',
        fields: [
          { id: 'f1', name: 'sku', type: 'string', required: true },
          { id: 'f2', name: 'name', type: 'string', required: true },
          { id: 'f3', name: 'category', type: 'string', required: true },
          { id: 'f4', name: 'quantity_on_hand', type: 'number', required: true },
          { id: 'f5', name: 'retail_price', type: 'number', required: true },
          { id: 'f6', name: 'unit_cost', type: 'number' },
          { id: 'f7', name: 'location', type: 'object' },
          { id: 'f8', name: 'supplier', type: 'string' },
          { id: 'f9', name: 'status', type: 'enum' },
        ],
        binding: {
          id: 'inventory.items',
          provider: 'warehouse_system',
          capabilities: ['PaginatedList', 'BulkExport'],
        },
      },
    },
    {
      id: '4',
      type: 'object',
      position: { x: 100, y: 350 },
      data: {
        id: '4',
        name: 'Analytics Events',
        fields: [
          { id: 'f1', name: 'event_id', type: 'string', required: true },
          { id: 'f2', name: 'timestamp', type: 'datetime', required: true },
          { id: 'f3', name: 'event_type', type: 'string', required: true },
          { id: 'f4', name: 'user_id', type: 'string' },
          { id: 'f5', name: 'session_id', type: 'string' },
          { id: 'f6', name: 'page_url', type: 'url' },
          { id: 'f7', name: 'device', type: 'object' },
          { id: 'f8', name: 'location', type: 'object' },
          { id: 'f9', name: 'properties', type: 'json' },
          { id: 'f10', name: 'conversion_value', type: 'number' },
        ],
        binding: {
          id: 'analytics.events',
          provider: 'google_analytics',
          capabilities: ['PaginatedList'],
        },
      },
    },
    {
      id: '5',
      type: 'object',
      position: { x: 450, y: 350 },
      data: {
        id: '5',
        name: 'Support Tickets',
        fields: [
          { id: 'f1', name: 'ticket_id', type: 'string', required: true },
          { id: 'f2', name: 'subject', type: 'string', required: true },
          { id: 'f3', name: 'status', type: 'enum', required: true },
          { id: 'f4', name: 'priority', type: 'enum', required: true },
          { id: 'f5', name: 'customer', type: 'object', required: true },
          { id: 'f6', name: 'assigned_to', type: 'string' },
          { id: 'f7', name: 'created_at', type: 'datetime' },
          { id: 'f8', name: 'updated_at', type: 'datetime' },
          { id: 'f9', name: 'messages_count', type: 'number' },
          { id: 'f10', name: 'channel', type: 'string' },
        ],
        binding: {
          id: 'support.tickets',
          provider: 'zendesk',
          capabilities: ['PaginatedList', 'WebhookSource'],
        },
      },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: '1',
      target: '2',
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'relation',
      data: {
        label: '1-N',
      },
    },
    {
      id: 'e2',
      source: '2',
      target: '5',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'relation',
      data: {
        label: '1-N',
      },
    },
    {
      id: 'e3',
      source: '1',
      target: '3',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'relation',
      data: {
        label: 'N-N',
      },
    },
  ],
}; 