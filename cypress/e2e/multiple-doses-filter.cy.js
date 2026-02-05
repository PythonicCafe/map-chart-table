describe('Múltiplas doses - Teste de filtro de doses', () => {
    beforeEach(() => {
        cy.visit('/')
        cy.fillAllFilters()
    })

    it('Mudança exibição gráfico/mapa torna seletor de dose múltiplo ou simples', function () {
        cy.get('.n-tabs-tab').contains('Gráfico').click()
        cy.get('#chart').should('be.visible')
        cy.get('.n-base-selection-tag-wrapper .n-tag__content').contains(
            '1ª dose'
        )
        cy.get('.n-tabs-tab').contains('Mapa').click()
        cy.get('.n-base-selection-overlay__wrapper').should(
            'contain',
            '1ª dose'
        )
    })

    it('Mudança exibição mapa/tabela/gráfico atualiza limite de seletor de municípios', function () {
        cy.get('.n-tabs-tab').contains('Tabela').click()

        cy.get('[data-test="select-granularity"]').should('be.visible').click()
        cy.get('.n-base-select-menu:visible')
            .contains('Municípios')
            .should('be.visible')
            .click()

        cy.get('body').type('{esc}')

        cy.get('[data-test="select-city"]').should('be.visible').click()

        cy.get('button.n-button--small-type')
            .should('be.visible')
            .contains('Marcar todos')
            .click()

        cy.get('button.n-button--small-type .n-spin').should('not.be.visible')
        cy.get('body').type('{esc}')

        cy.get('.n-tabs-tab').contains('Gráfico').click()

        cy.get('.n-base-selection-tag-wrapper .n-tag__content').contains('+30')

        cy.get('.n-base-selection-tag-wrappe .n-tag__content').contains('+30')

        cy.get('[data-test="select-city"]').should('be.visible').click()

        // Verifica que tem opção desabilitada no seletor de municípios
        cy.get('.n-base-select-menu:visible')
            .should('be.visible')
            .within(() => {
                cy.get('.n-scrollbar .n-virtual-list').scrollTo('bottom')

                cy.get(
                    'div.n-base-select-option.n-base-select-option--disabled'
                ).should('be.visible')
            })

        cy.get('body').type('{esc}')

        cy.get('.n-tabs-tab').contains('Tabela').click()

        cy.get('[data-test="select-city"]').should('be.visible').click()

        // Verifica que não tem opção desabilitada no seletor de municípios
        cy.get('.n-base-select-menu:visible')
            .should('be.visible')
            .within(() => {
                cy.get('.n-scrollbar .n-virtual-list').scrollTo('bottom')

                cy.get(
                    'div.n-base-select-option.n-base-select-option--disabled'
                ).should('not.exist')
            })

        cy.get('body').type('{esc}')
    })
})
