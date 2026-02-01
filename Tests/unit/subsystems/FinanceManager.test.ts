/**
 * FinanceManager.test.ts
 * FinanceManager ユニットテスト
 * 
 * Version: v4.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { FinanceManager } from '../../../Source/src/subsystems/finance/FinanceManager'

/**
 * Mock Log Manager
 */
const mockLogManager = {
  info: async () => {},
  warn: async () => {},
  error: async () => {},
}

/**
 * Mock Progress Manager
 */
const mockProgressManager = {
  startTask: async () => 'task_id',
  updateProgress: async () => {},
  completeTask: async () => {},
  errorTask: async () => {},
}

describe('FinanceManager', () => {
  let manager: FinanceManager

  beforeEach(async () => {
    manager = new FinanceManager(mockLogManager, mockProgressManager)
    await manager.initialize()
  })

  afterEach(async () => {
    await manager.shutdown()
  })

  it('should record expense', async () => {
    const expense = await manager.recordExpense(
      'TestManager',
      'Grocery shopping',
      50.0,
      'food'
    )
    
    expect(expense).toBeDefined()
    expect(expense.id).toBeDefined()
    expect(expense.amount).toBe(50.0)
    expect(expense.category).toBe('food')
  })

  it('should set budget', async () => {
    const budget = await manager.setBudget('food', 500)
    
    expect(budget).toBeDefined()
    expect(budget.category).toBe('food')
    expect(budget.limit).toBe(500)
  })

  it('should get budgets', async () => {
    await manager.setBudget('food', 500)
    await manager.setBudget('transport', 300)
    
    const budgets = await manager.getBudgets()
    
    expect(budgets).toBeDefined()
    expect(budgets.length).toBeGreaterThan(0)
  })

  it('should get finance dashboard card', async () => {
    const card = await manager.getFinanceCard()
    
    expect(card).toBeDefined()
    expect(card.id).toBe('finance-manager-card')
    expect(card.title).toBe('Finance Manager')
    expect(card.managerId).toBe('FinanceManager')
  })

  it('should get monthly report', async () => {
    const now = new Date()
    await manager.recordExpense('TestManager', 'Food', 30, 'food')
    await manager.recordExpense('TestManager', 'Gas', 40, 'transport')
    
    const report = await manager.getMonthlyReport()
    
    expect(report).toBeDefined()
    expect(report.month).toBeDefined()
    expect(report.year).toBeDefined()
    expect(report.totalSpent).toBeGreaterThan(0)
  })

  it('should validate expense categories', async () => {
    const categories = ['food', 'transport', 'utilities', 'entertainment', 'other']
    
    for (const category of categories) {
      const expense = await manager.recordExpense(
        'TestManager',
        `Expense in ${category}`,
        10,
        category as any
      )
      
      expect(expense.category).toBe(category)
    }
  })

  it('should calculate budget percentage', async () => {
    await manager.setBudget('food', 100)
    await manager.recordExpense('TestManager', 'Groceries', 75, 'food')
    
    const budgets = await manager.getBudgets()
    const foodBudget = budgets.find(b => b.category === 'food')
    
    if (foodBudget) {
      const percentage = (foodBudget.spent / foodBudget.limit) * 100
      expect(percentage).toBeGreaterThan(70)
    }
  })

  it('should track spending over time', async () => {
    const initialReport = await manager.getMonthlyReport()
    const initialSpent = initialReport.totalSpent
    
    await manager.recordExpense('TestManager', 'Expense', 100, 'food')
    
    const updatedReport = await manager.getMonthlyReport()
    const updatedSpent = updatedReport.totalSpent
    
    expect(updatedSpent).toBeGreaterThan(initialSpent)
  })
})
