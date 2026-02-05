describe('Filtros - Teste de filtragens', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.fillAllFilters()
  })

  it('Título e subtítulos após definição de filtragem', function() {
    // Assertions
    cy.get('h2.main-title')
      .should('have.text', 'Cobertura vacinal para Caxumba em 1 ano de idade por estado em 2001')

    cy.get('h3.sub-title')
      .should('have.text', 'Inclui todas as 1ª doses das vacinas do calendário vacinal da criança com componente Caxumba')
  })

  it('Mudança de tipo de doença', function() {
    // Seletor Doença
    cy.get('[data-test="select-doenca"] .n-base-selection-label')
      .should('be.visible')
      .click()

    cy.get('.n-base-select-menu:visible')
      .contains('Coqueluche')
      .should('be.visible')
      .click()

    cy.get('body').type('{esc}')

    // Assertions
    cy.get('h2.main-title')
      .should('have.text', 'Cobertura vacinal para Coqueluche em menores de 1 ano por estado em 2000')

    cy.get('h3.sub-title')
      .should('have.text', 'Inclui todas as 1ª doses das vacinas do calendário vacinal da criança com componente Coqueluche')
  })

  it('Limpar filtros', function() {
    cy.get('button[title="Limpar todas as seleções"]').click()
    cy.get('[data-test="select-doenca"]').should('contain', 'Selecione')
    cy.get('[data-test="select-dose"]').should('contain', 'Selecione')
    cy.get('[data-test="select-type"]').should('contain', 'Selecione')
    cy.get('[data-test="select-states"]').should('contain', 'Selecione')
    cy.get('.start-datepicker') .should('be.visible').should('contain', 'Início')
    cy.get('.end-datepicker') .should('be.visible').should('contain', 'Final')
    cy.get('[data-test="select-granularity"]').should('contain', 'Selecione')
  })
})
