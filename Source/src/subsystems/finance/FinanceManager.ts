/**
 * FinanceManager.ts
 * URMS v4.0 - Finance Manager
 * 
 * 家計・支出管理
 * BaseManager を継承した Subsystem Manager
 * 
 * Version: v4.0
 */

import { BaseManager, type ILogManager, type IProgressManager } from '@core/base/BaseManager'
import type { DashboardCard } from '@core/types/ManagerTypes'

/**
 * 支出記録
 */
export interface ExpenseRecord {
  id?: string
  date?: string
  category: string
  amount: number
  currency?: string
  description?: string
  tags?: string[]
}

/**
 * 予算情報
 */
export interface Budget {
  category: string
  limit: number
  spent: number
  currency: string
}

/**
 * Finance Manager インターフェース
 */
export interface IFinanceManager {
  recordExpense(manager: string, description: string, amount: number, category: string, currency?: string): Promise<ExpenseRecord>
  setBudget(category: string, limit: number, currency?: string): Promise<Budget>
  getBudgets(): Promise<Budget[]>
  getFinanceCard(): Promise<DashboardCard>
  getMonthlyReport(): Promise<FinanceReport>
}

/**
 * 月次レポート
 */
export interface FinanceReport {
  month: string
  year: number
  totalSpent: number
  byCategory: Record<string, number>
  budgetStatus: Record<string, { spent: number; limit: number; percentage: number }>
}

/**
 * Finance Manager 実装
 * 
 * 責務:
 * - 支出記録・管理
 * - 予算管理・追跡
 * - 家計レポート生成
 * - Dashboard との連携
 */
export class FinanceManager extends BaseManager implements IFinanceManager {
  private expenses: Map<string, ExpenseRecord> = new Map()
  private budgets: Map<string, Budget> = new Map()
  private nextId: number = 1

  constructor(
    logManager: ILogManager,
    progressManager: IProgressManager
  ) {
    super('FinanceManager', logManager, progressManager)
  }

  /**
   * 初期化処理
   */
  protected async onInitialize(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      'Initializing finance management...'
    )

    // デフォルト予算を設定
    this.initializeDefaultBudgets()

    await this.logManager.info(
      this.managerName,
      'Finance manager ready'
    )
  }

  /**
   * シャットダウン処理
   */
  protected async onShutdown(): Promise<void> {
    await this.logManager.info(
      this.managerName,
      `Saving ${this.expenses.size} expense records`
    )
    this.expenses.clear()
    this.budgets.clear()
  }

  /**
   * 支出記録
   */
  async recordExpense(_manager: string, description: string, amount: number, category: string, currency = 'USD'): Promise<ExpenseRecord> {
    this.checkInitialized()

    return await this.executeTask(`Record Expense: ${category}`, async () => {
      const id = `expense_${this.nextId++}`
      const date = new Date().toISOString()
      const newExpense: ExpenseRecord = {
        id,
        date,
        category,
        amount,
        currency,
        description,
      }

      this.expenses.set(id, newExpense)

      // 予算チェック
      const budget = this.budgets.get(category)
      if (budget) {
        budget.spent += amount
      }

      await this.logManager.info(
        this.managerName,
        `Expense recorded: ${category} ${currency}${amount}`
      )

      return newExpense
    })
  }

  /**
   * 予算設定
   */
  async setBudget(category: string, limit: number, currency = 'USD'): Promise<Budget> {
    this.checkInitialized()

    return await this.executeTask(`Set Budget: ${category}`, async () => {
      const existing = this.budgets.get(category) || {
        category,
        limit,
        spent: 0,
        currency,
      }

      existing.limit = limit
      this.budgets.set(category, existing)

      await this.logManager.info(
        this.managerName,
        `Budget set: ${category} ${existing.currency}${limit}`
      )

      return existing
    })
  }

  /**
   * 予算一覧取得
   */
  async getBudgets(): Promise<Budget[]> {
    this.checkInitialized()

    return await this.executeTask('Get Budgets', async () => {
      return Array.from(this.budgets.values())
    })
  }

  /**
   * Dashboard カード取得
   */
  async getFinanceCard(): Promise<DashboardCard> {
    this.checkInitialized()

    const report = await this.getMonthlyReport()
    const totalBudget = Array.from(this.budgets.values()).reduce((sum, b) => sum + b.limit, 0)
    const percentageUsed = totalBudget > 0 ? (report.totalSpent / totalBudget) * 100 : 0

    return {
      id: 'finance-manager-card',
      title: 'Finance Manager',
      manager: 'FinanceManager',
      status: percentageUsed > 80 ? 'warn' : 'normal',
      content: [
        { label: 'Total Expenses (Month)', value: `USD$${report.totalSpent.toFixed(2)}` },
        { label: 'Budget Limit', value: `USD$${totalBudget.toFixed(2)}` },
        { label: 'Usage %', value: `${percentageUsed.toFixed(1)}%` },
      ],
      actions: [
        {
          id: 'record-expense',
          label: 'Record Expense',
          command: 'finance:record_expense',
        },
      ],
      priority: 5,
    }
  }

  /**
   * 月次レポート取得
   */
  async getMonthlyReport(): Promise<FinanceReport> {
    this.checkInitialized()

    return await this.executeTask('Generate Monthly Report', async () => {
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      const monthExpenses = Array.from(this.expenses.values()).filter(e => (e.date || '').startsWith(currentMonth))

      const byCategory: Record<string, number> = {}
      let totalExpense = 0

      for (const expense of monthExpenses) {
        byCategory[expense.category] = (byCategory[expense.category] || 0) + (expense.amount || 0)
        totalExpense += expense.amount || 0
      }

      const budgetStatus: Record<string, any> = {}
      for (const [category, budget] of this.budgets) {
        const limit = budget.limit || 0
        const spent = byCategory[category] || 0
        budgetStatus[category] = {
          spent,
          limit,
          percentage: limit > 0 ? (spent / limit) * 100 : 0,
        }
      }

      return {
        month: currentMonth,
        year: now.getFullYear(),
        totalSpent: totalExpense,
        byCategory,
        budgetStatus,
      }
    })
  }

  /**
   * プライベート: デフォルト予算初期化
   */
  private initializeDefaultBudgets(): void {
    const defaultBudgets = [
      { category: 'food', limit: 500 },
      { category: 'transport', limit: 300 },
      { category: 'utilities', limit: 200 },
      { category: 'entertainment', limit: 150 },
    ]

    for (const { category, limit } of defaultBudgets) {
      this.budgets.set(category, {
        category,
        limit,
        spent: 0,
        currency: 'USD',
      })
    }
  }
}
