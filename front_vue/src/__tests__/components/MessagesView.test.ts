import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessagesView from '../../views/backoffice/MessagesView.vue'
import { contactService } from '../../services/contactService'

vi.mock('../../services/contactService', () => ({
  contactService: {
    getMessages: vi.fn(),
    deleteMessage: vi.fn(),
  },
}))

vi.mock('../../components/layout/AdminLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))

const vuetifyStubs = {
  VDataTable: {
    template: `
      <div data-testid="data-table">
        <slot v-for="item in items" name="item.createdAt" :item="item" />
        <slot v-for="item in items" name="item.message" :item="item" />
        <slot v-for="item in items" name="item.actions" :item="item" />
      </div>
    `,
    props: ['headers', 'items', 'loading', 'loadingText', 'noDataText', 'itemValue', 'hover'],
    emits: ['click:row'],
  },
  VDialog: {
    template: '<div v-if="modelValue" data-testid="dialog"><slot /></div>',
    props: ['modelValue', 'maxWidth'],
    emits: ['update:modelValue'],
  },
  VCard: { template: '<div><slot /></div>' },
  VCardTitle: { template: '<div><slot /></div>' },
  VCardSubtitle: { template: '<div><slot /></div>' },
  VCardText: { template: '<div><slot /></div>' },
  VCardActions: { template: '<div><slot /></div>' },
  VSpacer: { template: '<span />' },
  VBtn: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['variant', 'color', 'loading', 'icon', 'size'],
    emits: ['click'],
  },
  VAlert: {
    template: '<div :data-testid="$attrs[\'data-testid\'] || \'alert\'"><slot /></div>',
    props: ['type'],
  },
  VIcon: { template: '<span><slot /></span>' },
}

const mockMessages = [
  { id: 1, name: 'Alice', email: 'alice@example.com', message: 'Bonjour !', createdAt: '2025-06-01T10:00:00.000Z' },
  { id: 2, name: 'Bob', email: 'bob@example.com', message: 'A'.repeat(150), createdAt: '2025-06-02T12:00:00.000Z' },
]

function mountView() {
  return mount(MessagesView, {
    global: { stubs: vuetifyStubs },
  })
}

describe('MessagesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('charge les messages au montage', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    mountView()
    await nextTick()
    expect(contactService.getMessages).toHaveBeenCalledOnce()
  })

  it('affiche une erreur si le chargement échoue', async () => {
    vi.mocked(contactService.getMessages).mockRejectedValue(new Error('Network error'))
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    expect(wrapper.find('[data-testid="load-error"]').exists()).toBe(true)
  })

  it('tronque un message long à 100 caractères', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { truncate: (s: string | null | undefined, max?: number) => string }
    const truncated = vm.truncate('A'.repeat(150))
    expect(truncated).toHaveLength(101) // 100 chars + ellipsis char
    expect(truncated.endsWith('…')).toBe(true)
  })

  it('ne tronque pas un message court', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { truncate: (s: string | null | undefined, max?: number) => string }
    expect(vm.truncate('Bonjour !')).toBe('Bonjour !')
  })

  it('retourne une chaîne vide pour truncate(null)', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { truncate: (s: string | null | undefined, max?: number) => string }
    expect(vm.truncate(null)).toBe('')
    expect(vm.truncate(undefined)).toBe('')
  })

  it('formate une date ISO en français', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { formatDate: (s: string | null | undefined) => string }
    const result = vm.formatDate('2025-06-01T10:00:00.000Z')
    expect(result).toMatch(/2025/)
  })

  it('retourne "—" pour formatDate(null) ou date invalide', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { formatDate: (s: string | null | undefined) => string }
    expect(vm.formatDate(null)).toBe('—')
    expect(vm.formatDate(undefined)).toBe('—')
    expect(vm.formatDate('not-a-date')).toBe('—')
  })

  it('ouvre la modale au clic sur un message', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as {
      openDetail: (m: (typeof mockMessages)[0]) => void
      detailDialog: boolean
      selectedMessage: (typeof mockMessages)[0] | null
    }
    vm.openDetail(mockMessages[0])
    await nextTick()
    expect(vm.detailDialog).toBe(true)
    expect(vm.selectedMessage).toEqual(mockMessages[0])
  })

  it('affiche les icônes de suppression dans le tableau', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const btns = wrapper.findAll('[data-testid="delete-row-btn"]')
    expect(btns).toHaveLength(mockMessages.length)
  })

  it('openDelete ouvre le dialog de confirmation', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as {
      openDelete: (m: (typeof mockMessages)[0]) => void
      deleteDialog: boolean
      deleteTarget: (typeof mockMessages)[0] | null
    }
    vm.openDelete(mockMessages[0])
    await nextTick()
    expect(vm.deleteDialog).toBe(true)
    expect(vm.deleteTarget).toEqual(mockMessages[0])
  })

  it('handleDelete supprime le message et met à jour la liste', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue([...mockMessages])
    vi.mocked(contactService.deleteMessage).mockResolvedValue(undefined)
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const vm = wrapper.vm as {
      openDelete: (m: (typeof mockMessages)[0]) => void
      handleDelete: () => Promise<void>
      deleteDialog: boolean
      messages: typeof mockMessages
    }
    vm.openDelete(mockMessages[0])
    await vm.handleDelete()
    await nextTick()
    expect(contactService.deleteMessage).toHaveBeenCalledWith(mockMessages[0].id)
    expect(vm.messages.find(m => m.id === mockMessages[0].id)).toBeUndefined()
    expect(vm.deleteDialog).toBe(false)
  })

  it('closeDeleteDialog ferme le dialog sans supprimer', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as {
      openDelete: (m: (typeof mockMessages)[0]) => void
      closeDeleteDialog: () => void
      deleteDialog: boolean
    }
    vm.openDelete(mockMessages[0])
    await nextTick()
    expect(vm.deleteDialog).toBe(true)
    vm.closeDeleteDialog()
    await nextTick()
    expect(vm.deleteDialog).toBe(false)
    expect(contactService.deleteMessage).not.toHaveBeenCalled()
  })

  it('handleDelete affiche une erreur en cas d\'échec', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    vi.mocked(contactService.deleteMessage).mockRejectedValue(new Error('Server error'))
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const vm = wrapper.vm as {
      openDelete: (m: (typeof mockMessages)[0]) => void
      handleDelete: () => Promise<void>
      deleteError: string | null
    }
    vm.openDelete(mockMessages[0])
    await vm.handleDelete()
    await nextTick()
    expect(vm.deleteError).toBeTruthy()
    expect(wrapper.find('[data-testid="delete-error"]').exists()).toBe(true)
  })

  it('handleDelete ferme la modale de détail si le message affiché est supprimé', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue([...mockMessages])
    vi.mocked(contactService.deleteMessage).mockResolvedValue(undefined)
    const wrapper = mountView()
    await nextTick()
    await nextTick()
    const vm = wrapper.vm as {
      openDetail: (m: (typeof mockMessages)[0]) => void
      openDelete: (m: (typeof mockMessages)[0]) => void
      handleDelete: () => Promise<void>
      detailDialog: boolean
    }
    vm.openDetail(mockMessages[0])
    await nextTick()
    expect(vm.detailDialog).toBe(true)
    vm.openDelete(mockMessages[0])
    await vm.handleDelete()
    await nextTick()
    expect(vm.detailDialog).toBe(false)
  })
})
