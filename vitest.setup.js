import { beforeEach } from 'vitest'

// Ensure localStorage is available in jsdom environment
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    _data: {},
    getItem(key) {
      return this._data[key] || null
    },
    setItem(key, value) {
      this._data[key] = value
    },
    removeItem(key) {
      delete this._data[key]
    },
    clear() {
      this._data = {}
    },
    key(index) {
      const keys = Object.keys(this._data)
      return keys[index] || null
    },
    get length() {
      return Object.keys(this._data).length
    },
  }
}

// Mock localStorage for browser-like behavior
if (localStorage && !localStorage.setItem) {
  const data = {}
  Object.defineProperty(global, 'localStorage', {
    value: {
      getItem: (key) => data[key] || null,
      setItem: (key, value) => {
        data[key] = String(value)
      },
      removeItem: (key) => {
        delete data[key]
      },
      clear: () => {
        Object.keys(data).forEach(key => delete data[key])
      },
      key: (index) => Object.keys(data)[index] || null,
      get length() {
        return Object.keys(data).length
      },
    },
    writable: true,
  })
}
