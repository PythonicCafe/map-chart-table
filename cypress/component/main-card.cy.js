import { h } from 'vue'
import { NMessageProvider } from 'naive-ui'
import { createTestingPinia } from '@pinia/testing'
import MainCard from '@/components/main' 
import { useContentStore, useMapStore } from '@/stores'

// Stubs para isolar o componente
const stubs = {
  Chart: { template: '<div data-testid="chart-stub">Chart Component</div>' },
  FilterSuggestion: { template: '<div data-testid="filter-suggestion-stub">Suggestion</div>' },
  Map: { template: '<div data-testid="map-stub">Map Component</div>' },
  SubSelect: { template: '<div data-testid="sub-select-stub">SubSelect Component</div>' },
  Table: { template: '<div data-testid="table-stub">Table Component</div>' },
  SubButtons: { template: '<div data-testid="sub-buttons-stub">SubButtons Component</div>' },
}

describe('<MainCard />', () => {
  const defaultProps = {
    api: 'https://api.test.com'
  }

  const mountWithStore = (props = defaultProps, customState = {}) => {
    return cy.mount(NMessageProvider, {
      global: {
        stubs,
        plugins: [
          createTestingPinia({
            createSpy: cy.spy,
            stubActions: true,
            initialState: {
              [useContentStore.$id]: { 
                loading: false, 
                mainTitle: '', 
                subTitle: '', 
                tab: 'map',
                selectsEmpty: false,
                ...customState.content
              },
              [useMapStore.$id]: { 
                loadingMap: false,
                ...customState.map 
              }
            }
          })
        ]
      },
      slots: {
        default: () => h(MainCard, { ...props })
      }
    })
  }

  it('deve renderizar o layout Desktop por padrão (> 1368px)', () => {
    cy.viewport(1920, 1080)

    mountWithStore(defaultProps, {
      content: {
        mainTitle: 'Título Principal',
        subTitle: 'Subtítulo',
        loading: false,
        tab: 'map'
      }
    })

    cy.get('body').then(($body) => {
        if ($body.find('h2').length === 0) {
            cy.log('H2 não encontrado. Conteúdo do Body:', $body.text())
        }
    })

    cy.contains('Filtrar').should('not.exist')
    cy.get('.sub-select-container').find('[data-testid="sub-select-stub"]').should('exist')
    
  })

  it('deve renderizar o layout Mobile e abrir o Modal de filtros (< 1368px)', () => {
    cy.viewport(414, 896)

    mountWithStore(defaultProps, {
      content: { tab: 'map', loading: false }
    })

    cy.contains('button', 'Filtrar').should('be.visible')
    cy.get('.sub-select-container').should('not.exist')
    
    cy.contains('button', 'Filtrar').click()
    cy.get('[data-testid="sub-select-stub"]').should('be.visible')
    
    cy.contains('button', 'Pronto').click()
    cy.contains('button', 'Pronto').should('not.be.visible')
  })

  it('deve renderizar Skeletons quando não houver títulos', () => {
    mountWithStore(defaultProps, {
      content: { mainTitle: '', subTitle: '', loading: false }
    })

    cy.get('.n-skeleton').should('have.length', 2)
    cy.get('h2').should('not.exist')
  })

  it('deve alternar entre Mapa, Gráfico e Tabela baseado na store', () => {
    mountWithStore(defaultProps, {
      content: { tab: 'chart', loading: false }
    })

    cy.get('[data-testid="chart-stub"]').should('exist')
    cy.get('[data-testid="map-stub"]').should('not.exist')

    cy.then(() => {
      const contentStore = useContentStore()
      contentStore.tab = 'table'
    })
    
    cy.get('[data-testid="table-stub"]').should('exist')
  })

  it('deve mostrar loading spin quando a store indicar carregamento', () => {
    mountWithStore(defaultProps, {
      content: { loading: true },
      map: { loadingMap: false }
    })

    cy.get('.n-spin-container').should('exist')
  })

  it('deve mostrar sugestão de filtro se selectsEmpty for true', () => {
    mountWithStore(defaultProps, {
      content: { selectsEmpty: true, loading: false }
    })

    cy.get('[data-testid="filter-suggestion-stub"]').should('exist')
  })
})
