import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import VenueForm from '../../components/backoffice/VenueForm.vue'

const vuetifyStubs = {
  VForm: { template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>', emits: ['submit'] },
  VRow: { template: '<div><slot /></div>' },
  VCol: { template: '<div><slot /></div>' },
  VTextField: {
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'label', 'rules', 'variant', 'density'],
    emits: ['update:modelValue'],
  },
  VBtn: {
    template: '<button :disabled="loading" type="submit" @click="$emit(\'click\')"><slot /></button>',
    props: ['loading', 'type', 'color', 'variant'],
    emits: ['click'],
  },
}

function mountForm(props = {}) {
  return mount(VenueForm, {
    props,
    global: { stubs: vuetifyStubs },
    attachTo: document.body,
  })
}

describe('VenueForm', () => {
  it('affiche les champs du formulaire', () => {
    const wrapper = mountForm()
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })

  it('émet "cancel" au clic sur Annuler', async () => {
    const wrapper = mountForm()
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Annuler'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('n\'émet pas "submit" si les champs requis sont vides', async () => {
    const wrapper = mountForm()
    const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    await submitBtn?.trigger('click')
    expect(wrapper.emitted('submit')).toBeFalsy()
  })

  it('passe la prop loading sans erreur de rendu', () => {
    const wrapper = mountForm({ loading: true })
    const btn = wrapper.findAll('button').find(b => b.text().includes('Enregistrer'))
    expect(btn?.attributes('disabled')).toBeDefined()
  })
})
