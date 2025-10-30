/**
 * Performance tests for PokerTracker Pro
 * Tests bundle size, loading times, and memory usage
 */

import { calculateProfit, calculateROI, formatCurrency } from '@/lib/utils'
import { processTicketImage } from '@/services/ocrService'

describe('Performance Tests', () => {
  describe('Utility Functions Performance', () => {
    it('should handle large datasets efficiently', () => {
      const startTime = performance.now()
      
      // Test with large dataset
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        buyin: 100 + i,
        payout: 150 + i * 2,
      }))
      
      const results = largeDataset.map(item => ({
        roi: calculateROI(item.buyin, item.payout),
        profit: calculateProfit(item.buyin, item.payout),
        formatted: formatCurrency(item.payout),
      }))
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should process 10k items in reasonable time (less than 500ms)
      expect(executionTime).toBeLessThan(500)
      expect(results).toHaveLength(10000)
      expect(results[0].roi).toBeDefined()
    })

    it('should handle complex calculations efficiently', () => {
      const startTime = performance.now()
      
      // Complex calculation scenario
      for (let i = 0; i < 1000; i++) {
        const buyin = Math.random() * 1000
        const payout = Math.random() * 2000
        
        calculateROI(buyin, payout)
        calculateProfit(buyin, payout)
        formatCurrency(payout)
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete 1000 complex calculations in less than 50ms
      expect(executionTime).toBeLessThan(50)
    })
  })

  describe('OCR Service Performance', () => {
    it('should process images within acceptable time limits', async () => {
      const startTime = performance.now()
      
      // Create mock file
      const mockFile = new File(['test'], 'ticket.jpg', { type: 'image/jpeg' })
      
      const result = await processTicketImage(mockFile)
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // OCR processing should complete within 5 seconds (including mock delay)
      expect(executionTime).toBeLessThan(5000)
      expect(result.success).toBe(true)
    })

    it('should handle multiple concurrent OCR requests', async () => {
      const startTime = performance.now()
      
      // Create multiple concurrent requests
      const promises = Array.from({ length: 5 }, (_, i) => {
        const mockFile = new File(['test'], `ticket-${i}.jpg`, { type: 'image/jpeg' })
        return processTicketImage(mockFile)
      })
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // 5 concurrent OCR requests should complete within 6 seconds
      expect(executionTime).toBeLessThan(6000)
      expect(results).toHaveLength(5)
      expect(results.every(r => r.success)).toBe(true)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated operations', () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0
      
      // Perform repeated operations that might cause memory leaks
      for (let i = 0; i < 1000; i++) {
        const data = Array.from({ length: 100 }, (_, j) => ({
          id: `${i}-${j}`,
          buyin: Math.random() * 1000,
          payout: Math.random() * 2000,
        }))
        
        // Process data and discard
        data.forEach(item => {
          calculateROI(item.buyin, item.payout)
          formatCurrency(item.payout)
        })
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Data Structure Performance', () => {
    it('should efficiently sort large tournament arrays', () => {
      const startTime = performance.now()
      
      // Create large tournament dataset
      const tournaments = Array.from({ length: 5000 }, (_, i) => ({
        id: `tournament-${i}`,
        name: `Tournament ${i}`,
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        buyin: Math.floor(Math.random() * 1000) + 50,
        participants: Math.floor(Math.random() * 500) + 10,
      }))
      
      // Sort by date
      tournaments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should sort 5000 tournaments in less than 50ms
      expect(executionTime).toBeLessThan(50)
      expect(tournaments).toHaveLength(5000)
      
      // Verify sorting is correct
      for (let i = 1; i < tournaments.length; i++) {
        expect(new Date(tournaments[i-1].date).getTime())
          .toBeGreaterThanOrEqual(new Date(tournaments[i].date).getTime())
      }
    })

    it('should efficiently filter and search tournaments', () => {
      const startTime = performance.now()
      
      // Create dataset with searchable content
      const tournaments = Array.from({ length: 10000 }, (_, i) => ({
        id: `tournament-${i}`,
        name: `Tournament ${i % 100 === 0 ? 'Special' : 'Regular'} ${i}`,
        venue: `Venue ${i % 50}`,
        buyin: Math.floor(Math.random() * 1000) + 50,
      }))
      
      // Perform various filters
      const highBuyinTournaments = tournaments.filter(t => t.buyin > 500)
      const specialTournaments = tournaments.filter(t => t.name.includes('Special'))
      const venue1Tournaments = tournaments.filter(t => t.venue === 'Venue 1')
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete all filtering operations in less than 100ms
      expect(executionTime).toBeLessThan(100)
      expect(highBuyinTournaments.length).toBeGreaterThan(0)
      expect(specialTournaments.length).toBe(100) // Every 100th tournament
      expect(venue1Tournaments.length).toBe(200) // Every 50th tournament at venue 1
    })
  })

  describe('Bundle Size Considerations', () => {
    it('should not import unnecessary modules', () => {
      // This test helps identify if we're accidentally importing large modules
      const moduleKeys = Object.keys(require.cache || {})
      
      // Check for common heavy modules that shouldn't be in client bundle
      const heavyModules = moduleKeys.filter(key => 
        key.includes('node_modules') && (
          key.includes('webpack') ||
          key.includes('babel') ||
          key.includes('typescript') ||
          key.includes('eslint')
        )
      )
      
      // Development dependencies should not be in production bundle
      if (process.env.NODE_ENV === 'production') {
        expect(heavyModules).toHaveLength(0)
      }
    })
  })

  describe('React Component Performance', () => {
    it('should handle rapid state changes efficiently', () => {
      const startTime = performance.now()
      
      // Simulate rapid state changes that might happen in the app
      let state = { tournaments: [], loading: false, error: null }
      
      for (let i = 0; i < 1000; i++) {
        // Simulate adding tournaments
        state = {
          ...state,
          tournaments: [
            ...state.tournaments,
            {
              id: `t-${i}`,
              name: `Tournament ${i}`,
              buyin: Math.random() * 1000,
            }
          ]
        }
        
        // Simulate loading states
        if (i % 100 === 0) {
          state = { ...state, loading: !state.loading }
        }
      }
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should handle 1000 state changes in less than 200ms
      expect(executionTime).toBeLessThan(200)
      expect(state.tournaments).toHaveLength(1000)
    })
  })
})

// Performance benchmark utilities
export const benchmarkFunction = (fn: () => void, iterations = 1000) => {
  const startTime = performance.now()
  
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  
  const endTime = performance.now()
  return {
    totalTime: endTime - startTime,
    averageTime: (endTime - startTime) / iterations,
    iterations,
  }
}

// Memory usage utility
export const measureMemoryUsage = (fn: () => void) => {
  const beforeMemory = performance.memory?.usedJSHeapSize || 0
  
  fn()
  
  const afterMemory = performance.memory?.usedJSHeapSize || 0
  
  return {
    before: beforeMemory,
    after: afterMemory,
    difference: afterMemory - beforeMemory,
  }
}
