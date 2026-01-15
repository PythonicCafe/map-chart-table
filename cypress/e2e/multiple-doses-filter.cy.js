describe('Múltiplas doses - Teste de filtro de doses', () => {
  beforeEach(() => {
    cy.visit('/')

    cy.get('body').type('{esc}');

    // Seletor Doença
    cy.get('[data-test="select-doenca"] .n-base-selection-label')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('Caxumba')
      .should('be.visible')
      .click();

    // Seletor Dose
    cy.get('[data-test="select-dose"]')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('1ª dose')
      .should('be.visible')
      .click();

    cy.get('body').type('{esc}');

    // Seletor tipo de dado
    cy.get('[data-test="select-type"]')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('Cobertura')
      .should('be.visible')
      .click();

    cy.get('body').type('{esc}');

    // Seletor tipo de estados
    cy.get('[data-test="select-states"]')
      .should('be.visible')
      .click();

    cy.get('button.n-button--small-type')
      .should('be.visible')
      .contains('Marcar todos')
      .click();

    cy.get('body').type('{esc}');

    // Seletor tipo de ano inicial
    cy.get('.start-datepicker')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .should('be.visible')
      .within(() => {
        cy.get('.n-scrollbar .n-virtual-list')
          .scrollTo('top');

        cy.get('div.n-base-select-option__content')
          .contains('2000')
          .should('be.visible')
          .click();
      });

    cy.get('body').type('{esc}');

    // Seletor tipo de ano final
    cy.get('.end-datepicker')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .should('be.visible')
      .within(() => {
        cy.get('.n-scrollbar .n-virtual-list')
          .scrollTo('bottom');

        cy.get('div.n-base-select-option__content')
          .contains('2024')
          .should('be.visible')
          .click();
      });

    cy.get('body').type('{esc}');

    // Seletor tipo de granularidade
    cy.get('[data-test="select-granularity"]')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('Estados')
      .should('be.visible')
      .click();
  });
  it('Mudança para exibição de gráfico/mapa torna seletor de dose múltiplo ou simples', function() {
    cy.get('.n-tabs-tab').contains('Gráfico').click();
    cy.get('#chart').should('be.visible')
    cy.get('.n-base-selection-tag-wrapper .n-tag__content').contains('1ª dose');
    cy.get('.n-tabs-tab').contains('Mapa').click();
    cy.get('.n-base-selection-overlay__wrapper').should('contain', '1ª dose');
  });
});
