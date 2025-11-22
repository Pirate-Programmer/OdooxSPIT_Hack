'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { MoveStatus } from '@/lib/constants'

interface Product {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  shortCode: string
  warehouse: {
    id: string
    shortCode: string
  }
}

interface MoveLine {
  id?: string
  productId: string
  quantity: number
  toLocationId: string
}

interface Receipt {
  id: string
  reference: string
  contact?: string | null
  scheduleDate?: string | null
  status: MoveStatus
  responsible?: {
    loginId: string
  } | null
  moveLines: Array<{
    id: string
    productId: string
    product: { name: string }
    quantity: number
    toLocationId: string
    toLocation: { name: string }
  }>
}

export default function ReceiptFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isNew = id === 'new'

  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [warehouses, setWarehouses] = useState<Array<{ id: string; shortCode: string }>>([])
  const [formData, setFormData] = useState({
    contact: '',
    scheduleDate: '',
    warehouseId: '',
  })
  const [moveLines, setMoveLines] = useState<MoveLine[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [productsRes, warehousesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/warehouses'),
      ])
      const productsData = await productsRes.json()
      const warehousesData = await warehousesRes.json()
      setProducts(productsData.products)
      setWarehouses(warehousesData.warehouses)

      if (!isNew) {
        const receiptRes = await fetch(`/api/receipts/${id}`)
        const receiptData = await receiptRes.json()
        const receipt = receiptData.receipt
        setReceipt(receipt)
        setFormData({
          contact: receipt.contact || '',
          scheduleDate: receipt.scheduleDate
            ? new Date(receipt.scheduleDate).toISOString().split('T')[0]
            : '',
          warehouseId: '',
        })
        setMoveLines(
          receipt.moveLines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
            toLocationId: line.toLocationId,
          }))
        )

        // Load locations for the warehouse
        if (receipt.moveLines.length > 0) {
          const location = receipt.moveLines[0].toLocation
          const warehouse = warehousesData.warehouses.find(
            (w: any) => w.shortCode === location.warehouse.shortCode
          )
          if (warehouse) {
            setFormData((prev) => ({ ...prev, warehouseId: warehouse.id }))
            loadLocations(warehouse.id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async (warehouseId: string) => {
    try {
      const response = await fetch(`/api/locations?warehouseId=${warehouseId}`)
      const data = await response.json()
      setLocations(data.locations)
    } catch (error) {
      console.error('Error loading locations:', error)
    }
  }

  const handleWarehouseChange = (warehouseId: string) => {
    setFormData({ ...formData, warehouseId })
    loadLocations(warehouseId)
  }

  const addMoveLine = () => {
    setMoveLines([...moveLines, { productId: '', quantity: 0, toLocationId: '' }])
  }

  const updateMoveLine = (index: number, field: keyof MoveLine, value: any) => {
    const updated = [...moveLines]
    updated[index] = { ...updated[index], [field]: value }
    setMoveLines(updated)
  }

  const removeMoveLine = (index: number) => {
    setMoveLines(moveLines.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const warehouse = warehouses.find((w) => w.id === formData.warehouseId)
      if (!warehouse) {
        alert('Please select a warehouse')
        return
      }

      const data = {
        contact: formData.contact || undefined,
        scheduleDate: formData.scheduleDate || undefined,
        warehouseShortCode: warehouse.shortCode,
        moveLines: moveLines.filter(
          (line) => line.productId && line.toLocationId && line.quantity > 0
        ),
      }

      const url = isNew ? '/api/receipts' : `/api/receipts/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save receipt')
        return
      }

      const result = await response.json()
      router.push(`/receipts/${result.receipt.id}`)
    } catch (error) {
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: MoveStatus) => {
    if (!receipt) return

    try {
      const response = await fetch(`/api/receipts/${receipt.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to update status')
        return
      }

      loadData()
    } catch (error) {
      alert('An error occurred')
    }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isNew ? 'New Receipt' : `Receipt: ${receipt?.reference}`}
          </h1>
          <button
            onClick={() => router.push('/receipts')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to List
          </button>
        </div>

        {receipt && (
          <div className="mb-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status: {receipt.status}</span>
            {receipt.status === MoveStatus.DRAFT && (
              <button
                onClick={() => handleStatusChange(MoveStatus.READY)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                TODO (Move to Ready)
              </button>
            )}
            {receipt.status === MoveStatus.READY && (
              <button
                onClick={() => handleStatusChange(MoveStatus.DONE)}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Validate (Move to Done)
              </button>
            )}
            {receipt.status === MoveStatus.DONE && (
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-md hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                Print
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference</label>
                <input
                  type="text"
                  value={receipt?.reference || 'Auto-generated'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsible</label>
                <input
                  type="text"
                  value={receipt?.responsible?.loginId || 'Current user'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Receive From</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Date</label>
                <input
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>

            {isNew && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse</label>
                <select
                  value={formData.warehouseId}
                  onChange={(e) => handleWarehouseChange(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.shortCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Products</label>
                {isNew || receipt?.status === MoveStatus.DRAFT ? (
                  <button
                    type="button"
                    onClick={addMoveLine}
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                  >
                    Add Product
                  </button>
                ) : null}
              </div>

              <div className="space-y-4">
                {moveLines.map((line, index) => (
                  <div key={index} className="flex space-x-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                      <select
                        value={line.productId}
                        onChange={(e) => updateMoveLine(index, 'productId', e.target.value)}
                        required
                        disabled={!isNew && receipt?.status !== MoveStatus.DRAFT}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                      <select
                        value={line.toLocationId}
                        onChange={(e) => updateMoveLine(index, 'toLocationId', e.target.value)}
                        required
                        disabled={!isNew && receipt?.status !== MoveStatus.DRAFT}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <option value="">Select Location</option>
                        {locations.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name} ({l.shortCode})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                      <input
                        type="number"
                        value={line.quantity}
                        onChange={(e) =>
                          updateMoveLine(index, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        required
                        min="0"
                        step="0.01"
                        disabled={!isNew && receipt?.status !== MoveStatus.DRAFT}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      />
                    </div>
                    {(isNew || receipt?.status === MoveStatus.DRAFT) && (
                      <button
                        type="button"
                        onClick={() => removeMoveLine(index)}
                        className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {(isNew || receipt?.status === MoveStatus.DRAFT) && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/receipts')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </Layout>
  )
}

