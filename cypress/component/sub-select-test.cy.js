import { defineAsyncComponent, h } from 'vue'
import { NMessageProvider, NConfigProvider, ptBR, datePtBR } from 'naive-ui'
import { createTestingPinia } from '@pinia/testing'

import { useContentStore} from '@/stores/content'
import { useMessageStore } from '@/stores/message'

// --- MOCK DATA ---
const mockFormData = {
  sicks: [
    { label: 'Dengue', value: 'dengue' },
    { label: 'Gripe', value: 'gripe' }
  ],
  immunizers: [
    { label: 'Pfizer', value: 'pfizer' },
    { label: 'Coronavac', value: 'coronavac' }
  ],
  doses: [
    { label: '1ª Dose', value: 'd1' },
    { label: '2ª Dose', value: 'd2' }
  ],
  years: [
    { label: '2023', value: '2023' },
    { label: '2024', value: '2024' }
  ],
  granularities: [
    { label: 'País', value: 'País' },
    { label: 'Estado', value: 'Estado' },
    { label: 'Municípios', value: 'Municípios' }
  ],
  locals: [
    { label: 'Paraíba', value: 'PB' },
    { label: 'São Paulo', value: 'SP' }
  ],
  cities: [
    { label: 'João Pessoa', value: '2507507', uf: 'PB', codigo6: '250750' },
    { label: 'Campina Grande', value: '2504009', uf: 'PB', codigo6: '250400' }
  ],
  local: [],
  city: [],
  type: null,
  periodStart: null,
  periodEnd: null,
  granularity: null,
  sickImmunizer: null,
  dose: null
}

describe('<SubSelect />', () => {
  const mountWithStore = (props = {}, customContentState = {}) => {
    const SubSelectAsync = defineAsyncComponent(() => import('@/components/main/card-components/sub-select'))
    return cy.mount(NConfigProvider, {
      props: { locale: ptBR, dateLocale: datePtBR },
      slots: {
        default: () => h(NMessageProvider, {}, {
          default: () => h(SubSelectAsync, { ...props })
        })
      },
      global: {
        plugins: [
          createTestingPinia({
            createSpy: cy.spy,
            stubActions: true,
            initialState: {
              [useContentStore.$id]: {
                form: { ...mockFormData, ...customContentState.form },
                tab: 'chart',
                tabBy: 'sicks',
                disableLocalSelect: false,
                yearSlideAnimation: false,
                ...customContentState
              },
              [useMessageStore.$id]: {}
            }
          })
        ]
      }
    })
  }

  it('deve renderizar todos os campos principais por padrão', () => {
    mountWithStore()

    cy.contains('label', 'Doença').should('be.visible')
    cy.contains('label', 'Dose').should('be.visible')
    cy.contains('label', 'Tipo de dado').should('be.visible')
    cy.contains('label', 'Estados').should('be.visible')
    cy.contains('label', 'Abrangência temporal').should('be.visible')
    cy.contains('label', 'Granularidade').should('be.visible')
    
    cy.contains('label', 'Municípios').should('not.exist')
  })

  it('deve alternar o label entre "Doença" e "Vacina" baseado no tabBy', () => {
    mountWithStore({}, { tabBy: 'sicks' })
    cy.contains('label', 'Doença').should('be.visible')
    cy.contains('label', 'Vacina').should('not.exist')

    mountWithStore({}, { tabBy: 'immunizers' })
    cy.contains('label', 'Vacina').should('be.visible')
    cy.contains('label', 'Doença').should('not.exist')
  })

  it('deve mostrar o seletor de Municípios apenas quando Granularidade for "Municípios"', () => {
    // Caso 1: Granularidade Estado -> Municípios oculto
    mountWithStore({}, { 
      form: { granularity: 'Estado' } 
    })
    cy.wait(150)
    cy.contains('label', 'Municípios').should('not.exist')

    // Caso 2: Granularidade Municípios -> Municípios visível
    mountWithStore({}, { 
      form: { granularity: 'Municípios' } 
    })
    cy.wait(150)
    cy.contains('label', 'Municípios').should('be.visible')
  })

  it('deve aplicar classe mobile quando a prop isMobileScreen for true', () => {
    mountWithStore({ isMobileScreen: true })
    
    cy.get('.mct-selects').should('have.class', 'mct-selects--modal')
  })

  it('deve chamar a action clear() da store ao clicar no botão de borracha', () => {
    mountWithStore()

    cy.get('button[title="Limpar todas as seleções"]').click()

    cy.then(() => {
      const contentStore = useContentStore()
      expect(contentStore.form.sickImmunizer).to.be.null
      expect(contentStore.form.dose).to.be.null
      expect(contentStore.form.type).to.be.null
      expect(contentStore.form.local).to.deep.equal([])
      expect(contentStore.form.city).to.deep.equal([])
      expect(contentStore.clear).to.have.been.called
    })
  })

  it('deve desabilitar campos quando yearSlideAnimation for true', () => {
    mountWithStore({}, { yearSlideAnimation: true })

    cy.get('[data-test="select-doenca"] .n-base-selection').should('have.class', 'n-base-selection--disabled')
    cy.get('button[title="Limpar todas as seleções"]').should('be.disabled')
  })

  it('deve renderizar as opções corretas dentro do Select', () => {
    mountWithStore({}, { tabBy: 'sicks' })

    cy.get('[data-test="select-doenca"]').click()

    cy.get('.n-base-select-menu')
    .should('be.visible')
    .within(() => {
       cy.contains('div', 'Dengue').should('be.visible')
       cy.contains('div', 'Gripe').should('be.visible')
    })
  })
  
  it('deve exibir selects de ano de inicio e fim', () => {
    mountWithStore()
    
    cy.get('.start-datepicker').should('exist')
    cy.get('.end-datepicker').should('exist')
  })
})
