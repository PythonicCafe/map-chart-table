describe('Filtros - Teste de filtragens', () => {
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
  it('Título e subtítulos após definição de filtragem', function() {
    // Assertions
    cy.get('h2.main-title')
      .should('have.text', 'Cobertura vacinal para Caxumba em 1 ano de idade por estado em 2001');

    cy.get('h3.sub-title')
      .should('have.text', 'Inclui todas as 1ª doses das vacinas do calendário vacinal da criança com componente Caxumba');
  });
  it('Mudança de tipo de doença', function() {
    // Seletor Doença
    cy.get('[data-test="select-doenca"] .n-base-selection-label')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('Coqueluche')
      .should('be.visible')
      .click();

    cy.get('body').type('{esc}');

    // Assertions
    cy.get('h2.main-title')
      .should('have.text', 'Cobertura vacinal para Coqueluche em menores de 1 ano por estado em 2000');

    cy.get('h3.sub-title')
      .should('have.text', 'Inclui todas as 1ª doses das vacinas do calendário vacinal da criança com componente Coqueluche');
  });
  it('Limpar filtros', function() {
    cy.get('button[title="Limpar todas as seleções"]').click();
    cy.get('[data-test="select-doenca"]').should('contain', 'Selecione');
    cy.get('[data-test="select-dose"]').should('contain', 'Selecione');
    cy.get('[data-test="select-type"]').should('contain', 'Selecione');
    cy.get('[data-test="select-states"]').should('contain', 'Selecione');
    cy.get('[data-test="select-granularity"]').should('contain', 'Selecione');
  });
});
