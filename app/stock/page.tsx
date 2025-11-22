'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Product {
  id: string
  name: string
  description?: string | null
  perUnitCost: number
  onHand: number
  reserved: number
  freeToUse: number
}

interface Warehouse {
  id: string
  name: string
  shortCode: string
}

interface Location {
  id: string
  name: string
  shortCode: string
  warehouseId: string
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('')
  const [selectedWarehouseShortCode, setSelectedWarehouseShortCode] = useState<string>('')
  const [showAdjustForm, setShowAdjustForm] = useState(false)
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedWarehouse) {
      loadLocations(selectedWarehouse)
    } else {
      setLocations([])
    }
  }, [selectedWarehouse])

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

  const handleAdjustSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const quantity = parseFloat(formData.get('quantity') as string)
    const locationId = formData.get('locationId') as string

    if (!adjustingProduct || !selectedWarehouseShortCode) return

    try {
      const response = await fetch('/api/stock/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustingProduct.id,
          locationId,
          quantity,
          warehouseShortCode: selectedWarehouseShortCode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to adjust stock')
        return
      }

      setShowAdjustForm(false)
      setAdjustingProduct(null)
      setSelectedWarehouse('')
      setSelectedWarehouseShortCode('')
      loadData()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleAdjust = (product: Product) => {
    setAdjustingProduct(product)
    setShowAdjustForm(true)
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Stock View</h1>

        {showAdjustForm && adjustingProduct && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6 border border-gray-200 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Update Stock: {adjustingProduct.name}</h3>
            <form onSubmit={handleAdjustSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse</label>
                  <select
                    name="warehouseId"
                    required
                    value={selectedWarehouse}
                    onChange={(e) => {
                      const warehouseId = e.target.value
                      setSelectedWarehouse(warehouseId)
                      const warehouse = warehouses.find((w) => w.id === warehouseId)
                      if (warehouse) {
                        setSelectedWarehouseShortCode(warehouse.shortCode)
                      } else {
                        setSelectedWarehouseShortCode('')
                      }
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.shortCode})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedWarehouse && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                    <select
                      name="locationId"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                    >
                      <option value="">Select Location</option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.shortCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    required
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                  >
                    Update Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdjustForm(false)
                      setAdjustingProduct(null)
                      setSelectedWarehouse('')
                      setSelectedWarehouseShortCode('')
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-gray-700 transition-colors">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Per Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  On Hand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Free to Use
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
                    {product.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">{product.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ${product.perUnitCost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {product.onHand.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {product.freeToUse.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleAdjust(product)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}

