describe('Home Page - Teste de tela inicial', () => {
  beforeEach(() => {
    cy.visit('/')
  });

  it('Deve carregar a página inicial corretamente', () => {
    cy.url().should('include', '/')

    cy.title().should('not.be.empty')
  })

  it('Deve exibir o elemento principal do Vue', () => {
    cy.get('#app').should('be.visible')
  })

  it('Deve conter um texto específico', () => {
    cy.contains('h2', 'Explore a plataforma usando os filtros acima, ou selecione um dos exemplos abaixo').should('be.visible')
  })

  it('Deve ter Extra filter button', function() {
    cy.get('#app button.pulse-button').click();
    cy.get('div.n-card-header__main').should('have.text', 'Extra filter button');
    cy.get('p').should('have.text', 'Olá testando conteúdo de dialog');
  });

  it('Título e subtítulos após definição de filtragem', function() {
    // Seletor Doença
    cy.get('[data-test="select-doenca"] .n-base-selection-label')
      .should('be.visible')
      .click();

    cy.get('.n-base-select-menu:visible')
      .contains('Caxumba')
      .should('be.visible')
      .click();

    cy.get('body').type('{esc}');

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
      .contains('Marcar todos')
      .should('be.visible')
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

    // Assertions
    cy.get('h2.main-title')
      .should('have.text', 'Cobertura vacinal para Caxumba em 1 ano de idade por estado em 2001');

    cy.get('h3.sub-title')
      .should('have.text', 'Inclui todas as 1ª doses das vacinas do calendário vacinal da criança com componente Caxumba');
  });
});
