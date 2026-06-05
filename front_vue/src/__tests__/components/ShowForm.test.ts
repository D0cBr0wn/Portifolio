import { describe, it, expect } from 'vitest'
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import ShowForm from '../../components/backoffice/ShowForm.vue'
import { Show, Venue } from '@portfolio/shared'

const VFormStub = {
  template: '<div><slot /></div>',
  methods: {
    validate: () => Promise.resolve({ valid: false }),
  },
}

const vuetifyStubs = {
  VForm: VFormStub,
  VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' },
  VTextField: {
    template: '<input :data-label="label" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'type', 'rules', 'variant', 'density'],
    emits: ['update:modelValue'],
  },
  VSelect: {
    template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"></select>',
    props: ['modelValue', 'items', 'itemTitle', 'itemValue', 'label', 'rules', 'variant', 'density', 'noDataText', 'placeholder'],
    emits: ['update:modelValue'],
  },
  VTextarea: {
    template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)"></textarea>',
    props: ['modelValue', 'label', 'variant', 'density', 'rows', 'autoGrow'],
    emits: ['update:modelValue'],
  },
  VBtn: {
    template: '<button :type="type || \'button\'" :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'type', 'color', 'variant'],
    emits: ['click'],
  },
}

const venues = [
  new Venue({ id: 1, name: 'Zénith', city: 'Paris' }),
  new Venue({ id: 2, name: 'Olympia', city: 'Paris' }),
]

function mountForm(props = {}) {
  return mount(ShowForm, {
    props: { venues, ...props },
    global: { stubs: vuetifyStubs },
  })
}

describe('ShowForm', () => {
  it('affiche "Nouveau concert" sans initial', () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('Nouveau concert')
  })

  it('affiche "Modifier le concert" avec initial', () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1 })
    const wrapper = mountForm({ initial: show })
    expect(wrapper.text()).toContain('Modifier le concert')
  })

  it('pré-remplit la date sans lever TypeError quand initial.date est un objet Date', async () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1, label: 'Été' })
    const wrapper = mountForm({ initial: show })
    await nextTick()
    const dateInput = wrapper.findAll('input').find(i => i.attributes('data-label') === 'Date *')
    expect(dateInput).toBeDefined()
    expect(dateInput!.element.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('pré-remplit le label avec la valeur de initial', async () => {
    const show = new Show({ id: 1, date: '2025-07-14T20:00:00.000Z', venueId: 1, label: 'Festival été' })
    const wrapper = mountForm({ initial: show })
    await nextTick()
    const labelInput = wrapper.findAll('input').find(i => i.attributes('data-label') === 'Nom du concert')
    expect(labelInput!.element.value).toBe('Festival été')
  })

  it('émet "cancel" au clic sur Annuler', async () => {
    const wrapper = mountForm()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Annuler'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('désactive le bouton Enregistrer quand loading=true', () => {
    const wrapper = mountForm({ loading: true })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    expect(btn?.attributes('disabled')).toBeDefined()
  })

  it('n\'émet pas "submit" si la validation échoue', async () => {
    const wrapper = mountForm()
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    await submitBtn?.trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })
})
