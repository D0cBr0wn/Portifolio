import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MessagesView from '../../views/backoffice/MessagesView.vue'
import { contactService } from '../../services/contactService'

vi.mock('../../services/contactService', () => ({
  contactService: {
    getMessages: vi.fn(),
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
    props: ['variant'],
    emits: ['click'],
  },
  VAlert: {
    template: '<div data-testid="alert"><slot /></div>',
    props: ['type'],
  },
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
    expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true)
  })

  it('tronque un message long à 100 caractères', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { truncate: (s: string, max?: number) => string }
    const truncated = vm.truncate('A'.repeat(150))
    expect(truncated).toHaveLength(101) // 100 chars + ellipsis char
    expect(truncated.endsWith('…')).toBe(true)
  })

  it('ne tronque pas un message court', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { truncate: (s: string, max?: number) => string }
    expect(vm.truncate('Bonjour !')).toBe('Bonjour !')
  })

  it('formate une date ISO en français', async () => {
    vi.mocked(contactService.getMessages).mockResolvedValue(mockMessages)
    const wrapper = mountView()
    await nextTick()
    const vm = wrapper.vm as { formatDate: (s: string) => string }
    const result = vm.formatDate('2025-06-01T10:00:00.000Z')
    expect(result).toMatch(/2025/)
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
})
