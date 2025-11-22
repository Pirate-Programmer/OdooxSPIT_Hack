'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'

interface DashboardStats {
  receipts: {
    toReceive: number
    late: number
  }
  deliveries: {
    toDeliver: number
    waiting: number
    late: number
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading dashboard...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Receipts Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {stats?.receipts.toReceive || 0}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Receipts to Receive
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm">
                <span className="font-medium text-red-600 dark:text-red-400">
                  {stats?.receipts.late || 0} Late
                </span>
              </div>
            </div>
          </div>

          {/* Deliveries Card */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats?.deliveries.toDeliver || 0}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Deliveries to Deliver
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready</dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {stats?.deliveries.late || 0} Late
                  </span>
                </div>
                <div>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {stats?.deliveries.waiting || 0} Waiting
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

