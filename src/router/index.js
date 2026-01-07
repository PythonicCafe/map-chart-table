import { createRouter, createWebHistory } from 'vue-router'
import Main from '@/components/main'

/** @type {import('vue-router').Router|null} */
let routerInstance = null

/**
 * Create new incence fo Vue Router with dynamic setup
 *
 * @param {string} baseAddress - base path to routes (ex: '/').
 * @returns {import('vue-router').Router} An instance of VueRouter.
 */
export default (baseAddress) => {
    const router = createRouter({
        history: createWebHistory(),
        routes: [
            {
                path: baseAddress,
                name: 'main',
                component: Main,
            },
        ],
    })

    routerInstance = router

    return router
}

export const getRouter = () => routerInstance
