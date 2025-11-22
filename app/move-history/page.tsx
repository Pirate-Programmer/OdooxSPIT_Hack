'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { MoveType } from '@/lib/constants'

interface MoveLine {
  id: string
  quantity: number
  createdAt: string
  move: {
    id: string
    reference: string
    moveType: MoveType
    contact?: string | null
    createdAt: string
  }
  product: {
    id: string
    name: string
  }
  fromLocation?: {
    id: string
    name: string
    shortCode: string
  } | null
  toLocation?: {
    id: string
    name: string
    shortCode: string
  } | null
}

export default function MoveHistoryPage() {
  const [moveLines, setMoveLines] = useState<MoveLine[]>([])
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMoveHistory()
  }, [search, fromDate, toDate])

  const loadMoveHistory = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (fromDate) params.append('fromDate', fromDate)
      if (toDate) params.append('toDate', toDate)

      const response = await fetch(`/api/move-history?${params.toString()}`)
      const data = await response.json()
      setMoveLines(data.moveLines)
    } catch (error) {
      console.error('Error loading move history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRowColor = (moveLine: MoveLine) => {
    // In-moves: To is a Warehouse Location (green)
    if (moveLine.toLocation && !moveLine.fromLocation) {
      return 'bg-green-50 hover:bg-green-100'
    }
    // Out-moves: From is a Warehouse Location (red)
    if (moveLine.fromLocation && !moveLine.toLocation) {
      return 'bg-red-50 hover:bg-red-100'
    }
    // Internal moves (both from and to)
    if (moveLine.fromLocation && moveLine.toLocation) {
      if (moveLine.move.moveType === MoveType.RECEIPT) {
        return 'bg-green-50 hover:bg-green-100'
      }
      if (moveLine.move.moveType === MoveType.DELIVERY) {
        return 'bg-red-50 hover:bg-red-100'
      }
    }
    return 'bg-white hover:bg-gray-50'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Move History</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search (Reference/Contact)
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearch('')
                  setFromDate('')
                  setToDate('')
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-4 text-xs font-medium text-gray-500 uppercase">
              <div className="w-32">Reference</div>
              <div className="w-24">Date</div>
              <div className="flex-1">Product</div>
              <div className="w-24">Quantity</div>
              <div className="w-32">From</div>
              <div className="w-32">To</div>
              <div className="w-24">Status</div>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {moveLines.map((moveLine) => (
              <div
                key={moveLine.id}
                className={`px-4 py-3 transition-colors ${getRowColor(moveLine)}`}
              >
                <div className="flex items-center space-x-4 text-sm">
                  <div className="w-32 font-medium text-indigo-600">
                    {moveLine.move.reference}
                  </div>
                  <div className="w-24 text-gray-900">
                    {new Date(moveLine.move.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex-1 text-gray-900">{moveLine.product.name}</div>
                  <div className="w-24 text-gray-900">{moveLine.quantity.toFixed(2)}</div>
                  <div className="w-32 text-gray-600">
                    {moveLine.fromLocation
                      ? `${moveLine.fromLocation.name} (${moveLine.fromLocation.shortCode})`
                      : '-'}
                  </div>
                  <div className="w-32 text-gray-600">
                    {moveLine.toLocation
                      ? `${moveLine.toLocation.name} (${moveLine.toLocation.shortCode})`
                      : '-'}
                  </div>
                  <div className="w-24">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {moveLine.move.moveType}
                    </span>
                  </div>
                </div>
                {moveLine.move.contact && (
                  <div className="mt-1 text-xs text-gray-500">
                    Contact: {moveLine.move.contact}
                  </div>
                )}
              </div>
            ))}
          </div>
          {moveLines.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              No move history found
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
            <span>In-moves (Receipts)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 border border-red-300 rounded mr-2"></div>
            <span>Out-moves (Deliveries)</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}

