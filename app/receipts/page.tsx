'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { MoveStatus } from '@/lib/constants'

interface MoveLine {
  id: string
  productId: string
  product: {
    id: string
    name: string
  }
  quantity: number
  toLocationId: string
  toLocation: {
    id: string
    name: string
    shortCode: string
  }
}

interface Receipt {
  id: string
  reference: string
  contact?: string | null
  scheduleDate?: string | null
  status: MoveStatus
  responsible?: {
    id: string
    loginId: string
    name?: string | null
  } | null
  moveLines: MoveLine[]
}

export default function ReceiptsPage() {
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReceipts()
  }, [search])

  const loadReceipts = async () => {
    try {
      const url = `/api/receipts${search ? `?search=${encodeURIComponent(search)}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setReceipts(data.receipts)
    } catch (error) {
      console.error('Error loading receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: MoveStatus) => {
    try {
      const response = await fetch(`/api/receipts/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to update status')
        return
      }

      loadReceipts()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return

    try {
      const response = await fetch(`/api/receipts/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        alert('Failed to delete receipt')
        return
      }
      loadReceipts()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const getStatusColor = (status: MoveStatus) => {
    switch (status) {
      case MoveStatus.DRAFT:
        return 'bg-gray-100 text-gray-800'
      case MoveStatus.READY:
        return 'bg-blue-100 text-blue-800'
      case MoveStatus.DONE:
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedByStatus = {
    [MoveStatus.DRAFT]: receipts.filter((r) => r.status === MoveStatus.DRAFT),
    [MoveStatus.READY]: receipts.filter((r) => r.status === MoveStatus.READY),
    [MoveStatus.DONE]: receipts.filter((r) => r.status === MoveStatus.DONE),
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by Reference or Contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } rounded-l-md`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 ${
                  viewMode === 'kanban'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } rounded-r-md`}
              >
                Kanban
              </button>
            </div>
            <button
              onClick={() => router.push('/receipts/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              New Receipt
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {receipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/receipts/${receipt.id}`)}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                      >
                        {receipt.reference}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.contact || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.scheduleDate
                        ? new Date(receipt.scheduleDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          receipt.status
                        )}`}
                      >
                        {receipt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/receipts/${receipt.id}`)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </button>
                      {receipt.status === MoveStatus.DRAFT && (
                        <>
                          <button
                            onClick={() => handleStatusChange(receipt.id, MoveStatus.READY)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            TODO
                          </button>
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {receipt.status === MoveStatus.READY && (
                        <button
                          onClick={() => handleStatusChange(receipt.id, MoveStatus.DONE)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Validate
                        </button>
                      )}
                      {receipt.status === MoveStatus.DONE && (
                        <button
                          onClick={() => window.print()}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Print
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(groupedByStatus).map(([status, statusReceipts]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-4">
                  {status} ({statusReceipts.length})
                </h3>
                <div className="space-y-2">
                  {statusReceipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="bg-white p-4 rounded shadow cursor-pointer hover:shadow-md"
                      onClick={() => router.push(`/receipts/${receipt.id}`)}
                    >
                      <div className="font-medium text-sm text-indigo-600">
                        {receipt.reference}
                      </div>
                      {receipt.contact && (
                        <div className="text-xs text-gray-500 mt-1">{receipt.contact}</div>
                      )}
                      {receipt.scheduleDate && (
                        <div className="text-xs text-gray-500">
                          {new Date(receipt.scheduleDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="mt-2 flex space-x-2">
                        {receipt.status === MoveStatus.DRAFT && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(receipt.id, MoveStatus.READY)
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            TODO
                          </button>
                        )}
                        {receipt.status === MoveStatus.READY && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(receipt.id, MoveStatus.DONE)
                            }}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded"
                          >
                            Validate
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

