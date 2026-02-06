/// <reference types="vitest/globals" />
import { cn } from './utils'

describe('utils', () => {
    describe('cn (classNames)', () => {
        it('should merge class names correctly', () => {
            const result = cn('text-red-500', 'bg-blue-500')
            expect(result).toBe('text-red-500 bg-blue-500')
        })

        it('should handle conditional classes', () => {
            const isActive = true
            const result = cn('base-class', isActive && 'active-class')
            expect(result).toBe('base-class active-class')
        })

        it('should filter out falsy values', () => {
            const result = cn('base-class', false, null, undefined, 'valid-class')
            expect(result).toBe('base-class valid-class')
        })

        it('should handle tailwind merge (override conflicting classes)', () => {
            // tailwind-merge removes conflicting utilities
            const result = cn('px-4', 'px-6')
            expect(result).toBe('px-6')
        })

        it('should handle empty input', () => {
            const result = cn()
            expect(result).toBe('')
        })

        it('should handle arrays of classes', () => {
            const result = cn(['class-1', 'class-2'])
            expect(result).toBe('class-1 class-2')
        })
    })
})
