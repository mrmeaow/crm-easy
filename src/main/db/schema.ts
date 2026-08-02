import {
  sqliteTable,
  text,
  integer,
  real,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/sqlite-core'

function timestamps() {
  return {
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  }
}

export const contacts = sqliteTable(
  'contacts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name'),
    phone: text('phone'),
    email: text('email'),
    company: text('company'),
    address: text('address'),
    notes: text('notes'),
    ...timestamps(),
  },
  (t) => [
    index('contacts_name_idx').on(t.firstName, t.lastName),
    index('contacts_phone_idx').on(t.phone),
    index('contacts_email_idx').on(t.email),
  ],
)

export const tags = sqliteTable(
  'tags',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    color: text('color'),
    ...timestamps(),
  },
  (t) => [uniqueIndex('tags_name_idx').on(t.name)],
)

export const contactTags = sqliteTable(
  'contact_tags',
  {
    contactId: integer('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.contactId, t.tagId] })],
)

export const pipelineStages = sqliteTable('pipeline_stages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  position: integer('position').notNull().default(0),
  color: text('color'),
  isWon: integer('is_won', { mode: 'boolean' }).notNull().default(false),
  isLost: integer('is_lost', { mode: 'boolean' }).notNull().default(false),
  ...timestamps(),
})

export const leads = sqliteTable(
  'leads',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    source: text('source'),
    status: text('status').notNull().default('new'),
    owner: text('owner'),
    expectedValue: real('expected_value'),
    expectedCloseDate: integer('expected_close_date', { mode: 'timestamp_ms' }),
    stageId: integer('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
    convertedContactId: integer('converted_contact_id').references(() => contacts.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (t) => [
    index('leads_name_idx').on(t.name),
    index('leads_phone_idx').on(t.phone),
    index('leads_stage_idx').on(t.stageId),
  ],
)

export const deals = sqliteTable(
  'deals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    value: real('value').notNull().default(0),
    stageId: integer('stage_id').references(() => pipelineStages.id, { onDelete: 'set null' }),
    contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    leadId: integer('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    probability: integer('probability').notNull().default(0),
    expectedCloseDate: integer('expected_close_date', { mode: 'timestamp_ms' }),
    owner: text('owner'),
    wonAt: integer('won_at', { mode: 'timestamp_ms' }),
    lostReason: text('lost_reason'),
    ...timestamps(),
  },
  (t) => [index('deals_stage_idx').on(t.stageId), index('deals_contact_idx').on(t.contactId)],
)

export const activities = sqliteTable(
  'activities',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    type: text('type').notNull().default('note'),
    subject: text('subject').notNull(),
    detail: text('detail'),
    happenedAt: integer('happened_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index('activities_entity_idx').on(t.entityType, t.entityId)],
)

export const tasks = sqliteTable(
  'tasks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    dueAt: integer('due_at', { mode: 'timestamp_ms' }),
    reminderAt: integer('reminder_at', { mode: 'timestamp_ms' }),
    reminderSentAt: integer('reminder_sent_at', { mode: 'timestamp_ms' }),
    done: integer('done', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
    contactId: integer('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    dealId: integer('deal_id').references(() => deals.id, { onDelete: 'set null' }),
    ...timestamps(),
  },
  (t) => [index('tasks_due_idx').on(t.dueAt), index('tasks_done_idx').on(t.done)],
)

export const notes = sqliteTable(
  'notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    body: text('body').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    ...timestamps(),
  },
  (t) => [index('notes_entity_idx').on(t.entityType, t.entityId)],
)

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
