describe('Home Page - Teste de tela inicial', () => {
  beforeEach(() => {
    cy.visit('/')
  })

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

  it.only('Deve ter Extra filter button', function() {
    cy.get('#app button.pulse-button').click();

    // Verifica que dialog foi aberto e está sendo exibido em tela com cabeçalho e corpo
    cy.get('div.n-modal').should('exist', '.n-card-header__main');
    cy.get('div.n-modal').should('exist', '.n-card__content');
  })
})
