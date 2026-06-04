import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import VenueForm from '../../components/backoffice/VenueForm.vue'

// VForm rendu en <div> pour éviter la soumission native jsdom (requestSubmit non supporté)
// + méthode validate() exposée pour que le composant puisse y accéder via ref
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
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'rules', 'variant', 'density'],
    emits: ['update:modelValue'],
  },
  VBtn: {
    template: '<button :type="type || \'button\'" :disabled="loading" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'type', 'color', 'variant'],
    emits: ['click'],
  },
}

function mountForm(props = {}) {
  return mount(VenueForm, {
    props,
    global: { stubs: vuetifyStubs },
  })
}

describe('VenueForm', () => {
  it('affiche les champs du formulaire', () => {
    const wrapper = mountForm()
    expect(wrapper.findAll('input').length).toBeGreaterThanOrEqual(2)
  })

  it('émet "cancel" au clic sur Annuler', async () => {
    const wrapper = mountForm()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Annuler'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('n\'émet pas "submit" si les champs requis sont vides (validate retourne invalid)', async () => {
    const wrapper = mountForm()
    // Le stub VForm retourne { valid: false } → submit() s'arrête avant d'émettre
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    await submitBtn?.trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('désactive le bouton submit quand loading=true', () => {
    const wrapper = mountForm({ loading: true })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    expect(btn?.attributes('disabled')).toBeDefined()
  })

  it('affiche "Modifier le lieu" quand initial est fourni', () => {
    const initial = { id: 1, name: 'Le Zénith', city: 'Paris', address1: undefined, address2: undefined, zipCode: undefined, getFullAddress: () => '' }
    const wrapper = mountForm({ initial })
    expect(wrapper.text()).toContain('Modifier le lieu')
  })

  it('affiche "Nouveau lieu" sans initial', () => {
    const wrapper = mountForm()
    expect(wrapper.text()).toContain('Nouveau lieu')
  })
})
