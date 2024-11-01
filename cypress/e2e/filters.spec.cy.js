describe('template spec', () => {
    before(() => {
      cy.on('uncaught:exception', () => {
      return false
    })
    cy.viewport(1370, 720)
    cy.visit('localhost:5173')
  });
  it('Filters', () => {
    cy.get('[id="sickImmunizer"]').click()
    cy.get('.n-base-select-option__content').contains('10 sorotipos de pneumococos').click()
    cy.get('[id="dose"]').click()
    cy.get('.n-base-select-option__content').contains('1ª dose').click()
    cy.get('[id="type"]').click()
    cy.get('.n-base-select-option__content').contains('Cobertura').click()
    cy.get('[id="locals"]').click()
    cy.get('.n-base-select-option__content').contains('Todos').click()
    cy.get('[id="year-start"]').click()
    cy.get('.n-base-select-option__content').contains('2000').click()
    cy.get('[id="year-end"]').click()
    cy.get('[id="year-end"] input').type('2024');
    cy.get('.n-base-select-option__content').contains('2024').click()
    cy.get('[id="granularity"]').click()
    cy.get('.n-base-select-option__content').contains('Estados').click()
    cy.get('h2') // Select the <h2> element
      .should('have.text', 'Cobertura vacinal para 10 sorotipos de pneumococos em menores de 1 ano por estado em 2009');
  })
})
