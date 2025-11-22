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
  fromLocationId: string
  fromLocation: {
    id: string
    name: string
    shortCode: string
  }
}

interface Delivery {
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

export default function DeliveryPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeliveries()
  }, [search])

  const loadDeliveries = async () => {
    try {
      const url = `/api/delivery${search ? `?search=${encodeURIComponent(search)}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      setDeliveries(data.deliveries)
    } catch (error) {
      console.error('Error loading deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: MoveStatus) => {
    try {
      const response = await fetch(`/api/delivery/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to update status')
        return
      }

      loadDeliveries()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery?')) return

    try {
      const response = await fetch(`/api/delivery/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        alert('Failed to delete delivery')
        return
      }
      loadDeliveries()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const getStatusColor = (status: MoveStatus) => {
    switch (status) {
      case MoveStatus.DRAFT:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      case MoveStatus.WAITING:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
      case MoveStatus.READY:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      case MoveStatus.DONE:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  const groupedByStatus = {
    [MoveStatus.DRAFT]: deliveries.filter((d) => d.status === MoveStatus.DRAFT),
    [MoveStatus.WAITING]: deliveries.filter((d) => d.status === MoveStatus.WAITING),
    [MoveStatus.READY]: deliveries.filter((d) => d.status === MoveStatus.READY),
    [MoveStatus.DONE]: deliveries.filter((d) => d.status === MoveStatus.DONE),
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-gray-900 dark:text-gray-100">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delivery</h1>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search by Reference or Contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-l-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary-600 dark:bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-4 py-2 rounded-r-md transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-primary-600 dark:bg-primary-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Kanban
              </button>
            </div>
            <button
              onClick={() => router.push('/delivery/new')}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
            >
              New Delivery
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700 transition-colors">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Schedule Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => router.push(`/delivery/${delivery.id}`)}
                        className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                      >
                        {delivery.reference}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {delivery.contact || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {delivery.scheduleDate
                        ? new Date(delivery.scheduleDate).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          delivery.status
                        )}`}
                      >
                        {delivery.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/delivery/${delivery.id}`)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                      >
                        View
                      </button>
                      {delivery.status === MoveStatus.DRAFT && (
                        <>
                          <button
                            onClick={() => handleDelete(delivery.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {delivery.status === MoveStatus.WAITING && (
                        <button
                          onClick={() => handleStatusChange(delivery.id, MoveStatus.READY)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Move to Ready
                        </button>
                      )}
                      {delivery.status === MoveStatus.READY && (
                        <button
                          onClick={() => handleStatusChange(delivery.id, MoveStatus.DONE)}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 transition-colors"
                        >
                          Validate
                        </button>
                      )}
                      {delivery.status === MoveStatus.DONE && (
                        <button
                          onClick={() => window.print()}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
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
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(groupedByStatus).map(([status, statusDeliveries]) => (
              <div key={status} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  {status} ({statusDeliveries.length})
                </h3>
                <div className="space-y-2">
                  {statusDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="bg-white dark:bg-gray-700 p-4 rounded shadow cursor-pointer hover:shadow-md transition-colors"
                      onClick={() => router.push(`/delivery/${delivery.id}`)}
                    >
                      <div className="font-medium text-sm text-primary-600 dark:text-primary-400">
                        {delivery.reference}
                      </div>
                      {delivery.contact && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{delivery.contact}</div>
                      )}
                      {delivery.scheduleDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(delivery.scheduleDate).toLocaleDateString()}
                        </div>
                      )}
                      <div className="mt-2 flex space-x-2">
                        {delivery.status === MoveStatus.WAITING && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(delivery.id, MoveStatus.READY)
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded"
                          >
                            Move to Ready
                          </button>
                        )}
                        {delivery.status === MoveStatus.READY && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStatusChange(delivery.id, MoveStatus.DONE)
                            }}
                            className="text-xs px-2 py-1 bg-green-600 dark:bg-green-500 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
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

