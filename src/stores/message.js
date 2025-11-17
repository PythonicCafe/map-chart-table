import { defineStore } from 'pinia'

/**
 * Returns default state for message store
 * @returns {{
 * type: 'success' | 'info' | 'warning' | 'error' | null,
 * text: string | null,
 * duration: number | null
 * }}
 */
const getDefaultState = () => {
    return {
        type: null,
        text: null,
        duration: null,
    }
}

export const useMessageStore = defineStore('message', {
    state: () => getDefaultState(),
    actions: {
        /**
         * @param {'success'|'info'|'warning'|'error'} type - The type of message.
         * @param {string} text - The text to display in the alert.
         * @param {number} [duration=3000] - The duration for which the message should be displayed, in milliseconds.
         */
        message(type, text, duration = 3000) {
            this.type = type
            this.text = text
            this.duration = duration
        },
        clear() {
            const { type, text, duration } = getDefaultState()
            this.type = type
            this.text = text
            this.duration = duration
        },
    },
})
