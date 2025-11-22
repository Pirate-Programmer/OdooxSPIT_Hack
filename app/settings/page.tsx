'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'

interface Warehouse {
  id: string
  name: string
  shortCode: string
  address?: string | null
  locations: Location[]
}

interface Location {
  id: string
  name: string
  shortCode: string
  warehouseId: string
  warehouse: {
    id: string
    name: string
    shortCode: string
  }
}

export default function SettingsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [activeTab, setActiveTab] = useState<'warehouses' | 'locations'>('warehouses')
  const [showWarehouseForm, setShowWarehouseForm] = useState(false)
  const [showLocationForm, setShowLocationForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [warehousesRes, locationsRes] = await Promise.all([
        fetch('/api/warehouses'),
        fetch('/api/locations'),
      ])
      const warehousesData = await warehousesRes.json()
      const locationsData = await locationsRes.json()
      setWarehouses(warehousesData.warehouses)
      setLocations(locationsData.locations)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWarehouseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      shortCode: formData.get('shortCode') as string,
      address: formData.get('address') as string || undefined,
    }

    try {
      const url = editingWarehouse
        ? `/api/warehouses/${editingWarehouse.id}`
        : '/api/warehouses'
      const method = editingWarehouse ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save warehouse')
        return
      }

      setShowWarehouseForm(false)
      setEditingWarehouse(null)
      loadData()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleLocationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      shortCode: formData.get('shortCode') as string,
      warehouseId: formData.get('warehouseId') as string,
    }

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations'
      const method = editingLocation ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to save location')
        return
      }

      setShowLocationForm(false)
      setEditingLocation(null)
      loadData()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm('Are you sure you want to delete this warehouse?')) return

    try {
      const response = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        alert('Failed to delete warehouse')
        return
      }
      loadData()
    } catch (error) {
      alert('An error occurred')
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        alert('Failed to delete location')
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('warehouses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'warehouses'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Warehouses
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'locations'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Locations
            </button>
          </nav>
        </div>

        {activeTab === 'warehouses' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Warehouses</h2>
              <button
                onClick={() => {
                  setEditingWarehouse(null)
                  setShowWarehouseForm(true)
                }}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Add Warehouse
              </button>
            </div>

            {showWarehouseForm && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {editingWarehouse ? 'Edit Warehouse' : 'New Warehouse'}
                </h3>
                <form onSubmit={handleWarehouseSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={editingWarehouse?.name}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Code</label>
                      <input
                        type="text"
                        name="shortCode"
                        required
                        defaultValue={editingWarehouse?.shortCode}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                      <textarea
                        name="address"
                        defaultValue={editingWarehouse?.address || ''}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                        rows={3}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowWarehouseForm(false)
                          setEditingWarehouse(null)
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
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {warehouses.map((warehouse) => (
                  <li key={warehouse.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                            {warehouse.name}
                          </p>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({warehouse.shortCode})
                          </span>
                        </div>
                        {warehouse.address && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{warehouse.address}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {warehouse.locations?.length || 0} locations
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingWarehouse(warehouse)
                            setShowWarehouseForm(true)
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWarehouse(warehouse.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Locations</h2>
              <button
                onClick={() => {
                  setEditingLocation(null)
                  setShowLocationForm(true)
                }}
                className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
              >
                Add Location
              </button>
            </div>

            {showLocationForm && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-4 border border-gray-200 dark:border-gray-700 transition-colors">
                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
                  {editingLocation ? 'Edit Location' : 'New Location'}
                </h3>
                <form onSubmit={handleLocationSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Warehouse</label>
                      <select
                        name="warehouseId"
                        required
                        defaultValue={editingLocation?.warehouseId}
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        defaultValue={editingLocation?.name}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Short Code</label>
                      <input
                        type="text"
                        name="shortCode"
                        required
                        defaultValue={editingLocation?.shortCode}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLocationForm(false)
                          setEditingLocation(null)
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
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {locations.map((location) => (
                  <li key={location.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                      <div>
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">
                            {location.name}
                          </p>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({location.shortCode})
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Warehouse: {location.warehouse.name} ({location.warehouse.shortCode})
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingLocation(location)
                            setShowLocationForm(true)
                          }}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLocation(location.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

