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
  fromLocationId: string
}

interface StockCheck {
  productId: string
  available: number
  required: number
  inStock: boolean
}

interface Delivery {
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
    fromLocationId: string
    fromLocation: { name: string }
  }>
}

export default function DeliveryFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isNew = id === 'new'

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [stockChecks, setStockChecks] = useState<StockCheck[]>([])
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
        const deliveryRes = await fetch(`/api/delivery/${id}`)
        const deliveryData = await deliveryRes.json()
        const delivery = deliveryData.delivery
        setDelivery(delivery)
        setStockChecks(deliveryData.stockChecks || [])
        
        // If this delivery is WAITING, trigger a check to see if it can move to READY
        // The check happens when loading the delivery list, but we also do it here
        if (delivery.status === MoveStatus.WAITING) {
          // Trigger check by fetching delivery list (which auto-checks)
          fetch('/api/delivery').then(() => {
            // Reload this delivery to see if status changed
            fetch(`/api/delivery/${id}`)
              .then(res => res.json())
              .then(data => {
                if (data.delivery.status !== delivery.status) {
                  setDelivery(data.delivery)
                }
              })
          })
        }
        setFormData({
          contact: delivery.contact || '',
          scheduleDate: delivery.scheduleDate
            ? new Date(delivery.scheduleDate).toISOString().split('T')[0]
            : '',
          warehouseId: '',
        })
        setMoveLines(
          delivery.moveLines.map((line: any) => ({
            productId: line.productId,
            quantity: line.quantity,
            fromLocationId: line.fromLocationId,
          }))
        )

        // Load locations for the warehouse
        if (delivery.moveLines.length > 0) {
          const location = delivery.moveLines[0].fromLocation
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
    setMoveLines([...moveLines, { productId: '', quantity: 0, fromLocationId: '' }])
  }

  const updateMoveLine = (index: number, field: keyof MoveLine, value: any) => {
    const updated = [...moveLines]
    updated[index] = { ...updated[index], [field]: value }
    setMoveLines(updated)

    // Check stock when product or quantity changes
    if (field === 'productId' || field === 'quantity') {
      checkStock(updated[index].productId, updated[index].quantity, index)
    }
  }

  const checkStock = async (productId: string, quantity: number, index: number) => {
    if (!productId || quantity <= 0) return

    try {
      const response = await fetch(`/api/products`)
      const data = await response.json()
      const product = data.products.find((p: any) => p.id === productId)
      if (product) {
        const stockCheck = {
          productId,
          available: product.freeToUse,
          required: quantity,
          inStock: product.freeToUse >= quantity,
        }
        setStockChecks((prev) => {
          const updated = [...prev]
          updated[index] = stockCheck
          return updated
        })
      }
    } catch (error) {
      console.error('Error checking stock:', error)
    }
  }

  const removeMoveLine = (index: number) => {
    setMoveLines(moveLines.filter((_, i) => i !== index))
    setStockChecks(stockChecks.filter((_, i) => i !== index))
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
          (line) => line.productId && line.fromLocationId && line.quantity > 0
        ),
      }

      const url = isNew ? '/api/delivery' : `/api/delivery/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save delivery')
        return
      }

      const result = await response.json()
      if (result.stockChecks) {
        setStockChecks(result.stockChecks)
      }
      router.push(`/delivery/${result.delivery.id}`)
    } catch (error) {
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: MoveStatus) => {
    if (!delivery) return

    try {
      const response = await fetch(`/api/delivery/${delivery.id}/status`, {
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
            {isNew ? 'New Delivery' : `Delivery: ${delivery?.reference}`}
          </h1>
          <button
            onClick={() => router.push('/delivery')}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to List
          </button>
        </div>

        {delivery && (
          <div className="mb-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Status: {delivery.status}</span>
            {delivery.status === MoveStatus.WAITING && (
              <button
                onClick={() => handleStatusChange(MoveStatus.READY)}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
              >
                Move to Ready (Check Stock)
              </button>
            )}
            {delivery.status === MoveStatus.READY && (
              <button
                onClick={() => handleStatusChange(MoveStatus.DONE)}
                className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Validate (Move to Done)
              </button>
            )}
            {delivery.status === MoveStatus.DONE && (
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
                  value={delivery?.reference || 'Auto-generated'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsible</label>
                <input
                  type="text"
                  value={delivery?.responsible?.loginId || 'Current user'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Address</label>
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
                {isNew || delivery?.status === MoveStatus.DRAFT ? (
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
                {moveLines.map((line, index) => {
                  const stockCheck = stockChecks[index]
                  const isOutOfStock = stockCheck && !stockCheck.inStock
                  return (
                    <div
                      key={index}
                      className={`p-4 border-2 rounded-md transition-colors ${
                        isOutOfStock 
                          ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20' 
                          : 'border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {isOutOfStock && (
                        <div className="mb-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          ⚠ Stock Alert: Not enough stock available (Available: {stockCheck.available}, Required: {stockCheck.required})
                        </div>
                      )}
                      <div className="flex space-x-4 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                          <select
                            value={line.productId}
                            onChange={(e) => updateMoveLine(index, 'productId', e.target.value)}
                            required
                            disabled={!isNew && delivery?.status !== MoveStatus.DRAFT}
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
                            value={line.fromLocationId}
                            onChange={(e) => updateMoveLine(index, 'fromLocationId', e.target.value)}
                            required
                            disabled={!isNew && delivery?.status !== MoveStatus.DRAFT}
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
                            onChange={(e) => {
                              const value = e.target.value
                              // Allow empty input or valid numbers
                              if (value === '' || !isNaN(parseFloat(value))) {
                                updateMoveLine(index, 'quantity', value === '' ? 0 : parseFloat(value))
                              }
                            }}
                            required
                            min="0"
                            step="1"
                            disabled={!isNew && delivery?.status !== MoveStatus.DRAFT}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            placeholder="0"
                          />
                        </div>
                        {(isNew || delivery?.status === MoveStatus.DRAFT) && (
                          <button
                            type="button"
                            onClick={() => removeMoveLine(index)}
                            className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {(isNew || delivery?.status === MoveStatus.DRAFT) && (
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => router.push('/delivery')}
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

