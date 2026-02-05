describe('Abas - Teste de abas', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.fillAllFilters()
    })

    it('Mudança para exibição de gráfico e tabela', function () {
        cy.get('.n-tabs-tab').contains('Gráfico').click()
        cy.get('#chart').should('be.visible')

        cy.get('.n-tabs-tab').contains('Tabela').click()
        cy.get('.n-data-table').should('be.visible')
    })

    it('Mudança para pesquisa por vacina', function () {
        cy.get('.n-tabs-tab').contains('Vacina').click()

        // Assertion
        cy.get('div.empty-message > span').should(
            'have.text',
            'Selecione os filtros desejados para iniciar a visualização dos dados'
        )

        // Seletor Vacina
        cy.get('[data-test="select-doenca"] .n-base-selection-label')
            .should('be.visible')
            .click()

        cy.get('.n-base-select-menu:visible')
            .contains('Febre Amarela')
            .should('be.visible')
            .click()

        // Seletor Dose
        cy.get('[data-test="select-dose"]').should('be.visible').click()

        cy.get('.n-base-select-menu:visible')
            .contains('1ª dose')
            .should('be.visible')
            .click()

        cy.get('body').type('{esc}')

        // Seletor tipo de dado
        cy.get('[data-test="select-type"]').should('be.visible').click()

        cy.get('.n-base-select-menu:visible')
            .contains('Cobertura')
            .should('be.visible')
            .click()

        cy.get('body').type('{esc}')

        // Seletor tipo de granularidade
        cy.get('[data-test="select-granularity"]').should('be.visible').click()

        cy.get('.n-base-select-menu:visible')
            .contains('Estados')
            .should('be.visible')
            .click()

        // Assertions
        cy.get('h2.main-title').should(
            'have.text',
            'Cobertura vacinal de Febre Amarela por estado em 2000'
        )

        cy.get('h3.sub-title').should(
            'have.text',
            '1ª dose para menores de 1 ano'
        )
    })
})
