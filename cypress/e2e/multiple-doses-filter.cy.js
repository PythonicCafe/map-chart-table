describe('Múltiplas doses - Teste de filtro de doses', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.fillAllFilters();
  });
  it('Mudança para exibição de gráfico/mapa torna seletor de dose múltiplo ou simples', function() {
    cy.get('.n-tabs-tab').contains('Gráfico').click();
    cy.get('#chart').should('be.visible')
    cy.get('.n-base-selection-tag-wrapper .n-tag__content').contains('1ª dose');
    cy.get('.n-tabs-tab').contains('Mapa').click();
    cy.get('.n-base-selection-overlay__wrapper').should('contain', '1ª dose');
  });
});
