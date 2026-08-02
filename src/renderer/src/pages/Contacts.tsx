import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useContacts,
  useCreateContact,
  useDeleteContact,
  useImportContacts,
  useMergeContacts,
  useUpdateContact,
} from '../api/contacts'
import { useTags, useTagsForContact, useAssignTags, useCreateTag } from '../api/tags'
import {
  useCustomFieldDefs,
  useCustomFieldValues,
  useSaveCustomFieldValues,
} from '../api/customFields'
import { formatDate } from '@shared/format'
import { useSettings } from '../store/settings'
import { autoMapColumns, CONTACT_IMPORT_FIELDS } from '@shared/imports'
import type {
  Contact,
  ContactInput,
  ImportField,
  ImportMapping,
  ImportPreview,
  MergeGroup,
} from '@shared/types'
import EntityTimeline from '../components/EntityTimeline'

const EMPTY_FORM: ContactInput = {
  firstName: '',
  lastName: null,
  phone: null,
  email: null,
  company: null,
  address: null,
  notes: null,
}

type SortKey = 'firstName' | 'lastName' | 'phone' | 'email' | 'company' | 'createdAt'
type SortDir = 'asc' | 'desc'

const SORT_KEYS: { key: SortKey; labelKey: string }[] = [
  { key: 'firstName', labelKey: 'contacts.firstName' },
  { key: 'lastName', labelKey: 'contacts.lastName' },
  { key: 'phone', labelKey: 'contacts.phone' },
  { key: 'email', labelKey: 'contacts.email' },
  { key: 'company', labelKey: 'contacts.company' },
  { key: 'createdAt', labelKey: 'contacts.added' },
]

function fieldValue(contact: Contact, key: SortKey): string | number | Date {
  if (key === 'createdAt') return contact.createdAt
  const value =
    contact[key as keyof Pick<Contact, 'firstName' | 'lastName' | 'phone' | 'email' | 'company'>]
  return (value ?? '').toString().toLowerCase()
}

function ContactFormModal({
  initial,
  onCancel,
  onSubmit,
  busy,
  entityId,
}: {
  initial: ContactInput
  onCancel: () => void
  onSubmit: (input: ContactInput) => void
  busy: boolean
  entityId: number | null
}): React.JSX.Element {
  const { t } = useTranslation()
  const [form, setForm] = useState<ContactInput>(initial)

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (!form.firstName.trim()) return
    onSubmit(form)
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form
        className="card modal form-grid"
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{t('contacts.editTitle')}</h2>
        <input
          required
          placeholder={`${t('contacts.firstName')} *`}
          value={form.firstName}
          onChange={(event) => setForm({ ...form, firstName: event.target.value })}
        />
        <input
          placeholder={t('contacts.lastName')}
          value={form.lastName ?? ''}
          onChange={(event) => setForm({ ...form, lastName: event.target.value || null })}
        />
        <input
          placeholder={t('contacts.phone')}
          value={form.phone ?? ''}
          onChange={(event) => setForm({ ...form, phone: event.target.value || null })}
        />
        <input
          type="email"
          placeholder={t('contacts.email')}
          value={form.email ?? ''}
          onChange={(event) => setForm({ ...form, email: event.target.value || null })}
        />
        <input
          placeholder={t('contacts.company')}
          value={form.company ?? ''}
          onChange={(event) => setForm({ ...form, company: event.target.value || null })}
        />
        <input
          placeholder={t('contacts.address')}
          value={form.address ?? ''}
          onChange={(event) => setForm({ ...form, address: event.target.value || null })}
        />
        <textarea
          rows={3}
          placeholder={t('contacts.notesPlaceholder')}
          value={form.notes ?? ''}
          onChange={(event) => setForm({ ...form, notes: event.target.value || null })}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {t('common.save')}
          </button>
          <button type="button" className="btn" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        </div>
        {entityId !== null && (
          <div className="modal-section">
            <TagsSection contactId={entityId} />
          </div>
        )}
        {entityId !== null && (
          <div className="modal-section">
            <CustomFieldsSection contactId={entityId} />
          </div>
        )}
        {entityId !== null && (
          <div className="modal-section">
            <EntityTimeline entityType="contact" entityId={entityId} />
          </div>
        )}
      </form>
    </div>
  )
}

function TagsSection({ contactId }: { contactId: number }): React.JSX.Element {
  const { t } = useTranslation()
  const { data: allTags } = useTags()
  const { data: contactTags } = useTagsForContact(contactId)
  const assignTags = useAssignTags()
  const createTag = useCreateTag()
  const [showPicker, setShowPicker] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  const tagIds = new Set((contactTags ?? []).map((tag) => tag.id))

  function toggleTag(tagId: number) {
    const next = tagIds.has(tagId) ? [...tagIds].filter((id) => id !== tagId) : [...tagIds, tagId]
    void assignTags.mutateAsync({ contactId, tagIds: next })
  }

  function handleCreateTag() {
    if (!newTagName.trim()) return
    void createTag
      .mutateAsync({ name: newTagName.trim() })
      .then((tag) => {
        const next = [...tagIds, tag.id]
        return assignTags.mutateAsync({ contactId, tagIds: next })
      })
      .then(() => {
        setNewTagName('')
        setShowPicker(false)
      })
  }

  return (
    <div className="tags-section">
      <div className="tags-header">
        <strong>{t('tags.label')}</strong>
        <button className="btn btn-sm" onClick={() => setShowPicker((v) => !v)}>
          + {t('tags.add')}
        </button>
      </div>
      <div className="tag-list">
        {(contactTags ?? []).map((tag) => (
          <span key={tag.id} className="tag-badge" style={{ background: tag.color ?? undefined }}>
            {tag.name}
            <button
              className="tag-remove"
              onClick={() => toggleTag(tag.id)}
              aria-label={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
        {(contactTags ?? []).length === 0 && <span className="muted">{t('tags.empty')}</span>}
      </div>
      {showPicker && (
        <div className="tag-picker">
          <div className="tag-picker-row">
            <input
              className="input"
              placeholder={t('tags.newPlaceholder')}
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void handleCreateTag()
                }
              }}
            />
            <button className="btn btn-sm" onClick={() => void handleCreateTag()}>
              {t('common.add')}
            </button>
          </div>
          {(allTags ?? [])
            .filter((tag) => !tagIds.has(tag.id))
            .map((tag) => (
              <button key={tag.id} className="tag-picker-item" onClick={() => toggleTag(tag.id)}>
                <span
                  className="tag-dot"
                  style={{ background: tag.color ?? 'var(--text-muted)' }}
                />
                {tag.name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

function CustomFieldsSection({ contactId }: { contactId: number }): React.JSX.Element {
  const { t } = useTranslation()
  const { data: defs } = useCustomFieldDefs('contact')
  const { data: values } = useCustomFieldValues('contact', contactId)
  const saveValues = useSaveCustomFieldValues()
  const [localValues, setLocalValues] = useState<Record<number, string>>({})
  const [saved, setSaved] = useState(false)

  const valueMap = useMemo(() => {
    return new Map((values ?? []).map((v) => [v.defId, v.value ?? '']))
  }, [values])

  useEffect(() => {
    const init: Record<number, string> = {}
    for (const def of defs ?? []) {
      init[def.id] = valueMap.get(def.id) ?? ''
    }
    setLocalValues(init)
  }, [defs, valueMap])

  function handleSave() {
    const toSave = Object.entries(localValues).map(([defId, value]) => ({
      defId: Number(defId),
      value: value || null,
    }))
    void saveValues
      .mutateAsync({ entityType: 'contact', entityId: contactId, values: toSave })
      .then(() => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      })
  }

  if (!defs || defs.length === 0) return <></>

  return (
    <div className="custom-fields-section">
      <div className="cf-section-header">
        <strong>{t('customField.fields')}</strong>
        <button
          className="btn btn-sm"
          onClick={() => void handleSave()}
          disabled={saveValues.isPending}
        >
          {saved ? t('common.saved') : t('common.save')}
        </button>
      </div>
      {(defs ?? []).map((def) => (
        <label key={def.id} className="cf-field">
          <span>{def.label}</span>
          {def.type === 'select' ? (
            <select
              className="select"
              value={localValues[def.id] ?? ''}
              onChange={(e) => setLocalValues((prev) => ({ ...prev, [def.id]: e.target.value }))}
            >
              <option value="">—</option>
              {(def.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : def.type === 'date' ? (
            <input
              type="date"
              className="input"
              value={localValues[def.id] ?? ''}
              onChange={(e) => setLocalValues((prev) => ({ ...prev, [def.id]: e.target.value }))}
            />
          ) : def.type === 'number' ? (
            <input
              type="number"
              className="input"
              value={localValues[def.id] ?? ''}
              onChange={(e) => setLocalValues((prev) => ({ ...prev, [def.id]: e.target.value }))}
            />
          ) : (
            <input
              type="text"
              className="input"
              value={localValues[def.id] ?? ''}
              onChange={(e) => setLocalValues((prev) => ({ ...prev, [def.id]: e.target.value }))}
            />
          )}
        </label>
      ))}
    </div>
  )
}

function ImportWizard({
  preview,
  onClose,
}: {
  preview: ImportPreview
  onClose: () => void
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const importContacts = useImportContacts()
  const [mapping, setMapping] = useState<ImportMapping>(() => autoMapColumns(preview.headers ?? []))

  if (preview.canceled || !preview.filePath) return null

  function updateMapping(field: ImportField, value: string): void {
    setMapping({ ...mapping, [field]: value === '' ? null : Number(value) })
  }

  const mappedCount = CONTACT_IMPORT_FIELDS.filter((field) => mapping[field] !== null).length

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal import-modal" onClick={(event) => event.stopPropagation()}>
        <h2>{t('import.title')}</h2>
        <p className="muted">
          {t('import.file')}: <strong>{preview.fileName}</strong> — {preview.totalRows ?? 0}{' '}
          {t('import.rows')}
        </p>

        <table className="mapping-table">
          <thead>
            <tr>
              <th>{t('import.field')}</th>
              <th>{t('import.column')}</th>
            </tr>
          </thead>
          <tbody>
            {CONTACT_IMPORT_FIELDS.map((field) => (
              <tr key={field}>
                <td>{t(`import.fields.${field}`)}</td>
                <td>
                  <select
                    className="select"
                    value={mapping[field] === null ? '' : String(mapping[field])}
                    onChange={(event) => updateMapping(field, event.target.value)}
                  >
                    <option value="">—</option>
                    {(preview.headers ?? []).map((header, index) => (
                      <option key={index} value={index}>
                        {header || t('import.columnN', { n: index + 1 })}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {preview.rows && preview.rows.length > 0 && (
          <div className="import-preview">
            <p className="muted">{t('import.preview')}</p>
            <table>
              <thead>
                <tr>
                  {(preview.headers ?? []).slice(0, 6).map((header, index) => (
                    <th key={index}>{header || index + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 5).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.slice(0, 6).map((cell, cellIndex) => (
                      <td key={cellIndex} className="muted">
                        {cell || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importContacts.data && (
          <p className="success-text">
            {t('import.done', {
              imported: importContacts.data.imported,
              skipped: importContacts.data.skipped,
            })}
          </p>
        )}
        {importContacts.isError && <p className="error-text">{t('common.error')}</p>}

        <div className="form-actions">
          <button
            className="btn btn-primary"
            disabled={mappedCount === 0 || importContacts.isPending}
            onClick={() => importContacts.mutate({ filePath: preview.filePath as string, mapping })}
          >
            {importContacts.isPending ? t('common.loading') : t('import.run')}
          </button>
          <button className="btn" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}

function MergePanel({ onDone }: { onDone: () => void }): React.JSX.Element {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<MergeGroup[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Record<string, number>>({})
  const mergeContacts = useMergeContacts()
  const { data: contacts } = useContacts()

  async function findDuplicates(): Promise<void> {
    setLoading(true)
    try {
      const result = await window.crm.contacts.mergeGroups()
      setGroups(result)
    } finally {
      setLoading(false)
    }
  }

  function contactName(id: number): string {
    const contact = contacts?.find((c) => c.id === id)
    if (!contact) return `#${id}`
    return `${contact.firstName} ${contact.lastName ?? ''}`.trim()
  }

  function mergeGroup(key: string): void {
    const masterId = selected[key]
    if (masterId === undefined) return
    const group = groups?.find((g) => g.key === key)
    if (!group) return
    mergeContacts.mutate(
      { masterId, duplicateIds: group.contactIds.filter((id) => id !== masterId) },
      { onSuccess: () => findDuplicates().catch(() => undefined) },
    )
  }

  return (
    <div className="card merge-panel">
      <div className="merge-head">
        <strong>{t('merge.title')}</strong>
        <button className="btn btn-sm" disabled={loading} onClick={() => void findDuplicates()}>
          {loading ? t('common.loading') : t('merge.find')}
        </button>
      </div>
      {groups === null && <p className="muted">{t('merge.hint')}</p>}
      {groups !== null && groups.length === 0 && <p className="muted">{t('merge.none')}</p>}
      {groups?.map((group) => (
        <div key={group.key} className="merge-group">
          <p className="muted">{t('merge.matchKey', { key: group.key })}</p>
          <div className="form-row">
            <select
              className="select"
              value={selected[group.key] ?? group.contactIds[0]}
              onChange={(event) =>
                setSelected({ ...selected, [group.key]: Number(event.target.value) })
              }
            >
              {group.contactIds.map((id) => (
                <option key={id} value={id}>
                  {contactName(id)}
                </option>
              ))}
            </select>
            <button
              className="btn btn-primary btn-sm"
              disabled={mergeContacts.isPending}
              onClick={() => mergeGroup(group.key)}
            >
              {t('merge.merge')}
            </button>
          </div>
        </div>
      ))}
      {groups !== null && groups.length > 0 && (
        <button className="btn btn-sm" onClick={onDone}>
          {t('common.close')}
        </button>
      )}
    </div>
  )
}

function Contacts(): React.JSX.Element {
  const { t } = useTranslation()
  const { language } = useSettings()
  const { data: contacts, isLoading, isError } = useContacts()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Contact | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState<ContactInput>(EMPTY_FORM)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [importBusy, setImportBusy] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)

  const filtered = useMemo(() => {
    const haystackOf = (contact: Contact): string =>
      [
        contact.firstName,
        contact.lastName,
        contact.phone,
        contact.email,
        contact.company,
        contact.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    const needle = query.trim().toLowerCase()
    const matches = (contacts ?? []).filter((contact) => haystackOf(contact).includes(needle))
    const direction = sortDir === 'asc' ? 1 : -1
    return [...matches].sort((a, b) => {
      const aValue = fieldValue(a, sortKey)
      const bValue = fieldValue(b, sortKey)
      if (aValue < bValue) return -1 * direction
      if (aValue > bValue) return 1 * direction
      return 0
    })
  }, [contacts, query, sortKey, sortDir])

  function toggleSort(key: SortKey): void {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleSubmit(event: React.FormEvent): void {
    event.preventDefault()
    if (!form.firstName.trim()) return
    createContact.mutate(form, {
      onSuccess: () => {
        setForm(EMPTY_FORM)
        setShowForm(false)
      },
    })
  }

  function handleEditSave(input: ContactInput): void {
    if (!editing) return
    updateContact.mutate({ id: editing.id, input }, { onSuccess: () => setEditing(null) })
  }

  function handleDelete(id: number): void {
    if (window.confirm(t('common.confirmDelete'))) {
      deleteContact.mutate(id)
    }
  }

  async function handleImport(): Promise<void> {
    setImportBusy(true)
    try {
      const preview = await window.crm.contacts.importParse()
      setImportPreview(preview)
    } finally {
      setImportBusy(false)
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h1>{t('contacts.title')}</h1>
          <p>{t('contacts.subtitle')}</p>
        </div>
        <div className="form-actions">
          <button className="btn" onClick={() => setMergeOpen((v) => !v)}>
            {t('merge.button')}
          </button>
          <button className="btn" disabled={importBusy} onClick={() => void handleImport()}>
            {t('import.button')}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            + {t('contacts.add')}
          </button>
        </div>
      </header>

      <input
        type="search"
        className="filter-input"
        placeholder={t('contacts.searchPlaceholder')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      {showForm && (
        <form className="card form-grid" onSubmit={handleSubmit}>
          <input
            required
            placeholder={`${t('contacts.firstName')} *`}
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
          />
          <input
            placeholder={t('contacts.lastName')}
            value={form.lastName ?? ''}
            onChange={(event) => setForm({ ...form, lastName: event.target.value || null })}
          />
          <input
            placeholder={t('contacts.phone')}
            value={form.phone ?? ''}
            onChange={(event) => setForm({ ...form, phone: event.target.value || null })}
          />
          <input
            type="email"
            placeholder={t('contacts.email')}
            value={form.email ?? ''}
            onChange={(event) => setForm({ ...form, email: event.target.value || null })}
          />
          <input
            placeholder={t('contacts.company')}
            value={form.company ?? ''}
            onChange={(event) => setForm({ ...form, company: event.target.value || null })}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={createContact.isPending}>
              {t('common.save')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setForm(EMPTY_FORM)
                setShowForm(false)
              }}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {mergeOpen && <MergePanel onDone={() => setMergeOpen(false)} />}

      <div className="card table-card">
        {isLoading && <p className="muted">{t('common.loading')}</p>}
        {isError && <p className="muted">{t('common.error')}</p>}
        {!isLoading && !isError && filtered.length === 0 && (
          <p className="muted">{t('contacts.empty')}</p>
        )}
        {!isLoading && !isError && filtered.length > 0 && (
          <table>
            <thead>
              <tr>
                {SORT_KEYS.map(({ key, labelKey }) => (
                  <th key={key} className="sortable" onClick={() => toggleSort(key)}>
                    {t(labelKey)}
                    {sortKey === key && (
                      <span aria-hidden="true">{sortDir === 'asc' ? ' ▲' : ' ▼'}</span>
                    )}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.firstName}</td>
                  <td className="muted">{contact.lastName ?? '—'}</td>
                  <td className="muted">{contact.phone ?? '—'}</td>
                  <td className="muted">{contact.email ?? '—'}</td>
                  <td className="muted">{contact.company ?? '—'}</td>
                  <td className="row-actions">
                    <span className="muted table-date">
                      {formatDate(contact.createdAt, language)}
                    </span>
                    <button className="btn btn-sm" onClick={() => setEditing(contact)}>
                      {t('common.edit')}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(contact.id)}
                    >
                      {t('common.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ContactFormModal
          initial={{
            firstName: editing.firstName,
            lastName: editing.lastName,
            phone: editing.phone,
            email: editing.email,
            company: editing.company,
            address: editing.address,
            notes: editing.notes,
          }}
          busy={updateContact.isPending}
          entityId={editing.id}
          onCancel={() => setEditing(null)}
          onSubmit={handleEditSave}
        />
      )}

      {importPreview && (
        <ImportWizard preview={importPreview} onClose={() => setImportPreview(null)} />
      )}
    </section>
  )
}

export default Contacts
