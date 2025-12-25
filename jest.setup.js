import '@testing-library/jest-dom'

// Mock environment variables
process.env.DATABASE_URL = 'file:../test.db'
process.env.JWT_SECRET = 'test-secret-for-testing'
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing'
process.env.AWS_ACCESS_KEY_ID = 'test-access-key'
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key'
process.env.AWS_S3_BUCKET_NAME = 'test-bucket'
process.env.SENDGRID_API_KEY = 'test-sendgrid-key'
process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid'
process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token'
process.env.TWILIO_PHONE_NUMBER = '+1234567890'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/12345'

// Mock global functions
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {}

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString()
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock navigator.geolocation
global.navigator.geolocation = {
  getCurrentPosition: jest.fn((success, error) => {
    setTimeout(() => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
        },
      })
    }, 100)
  }),
  watchPosition: jest.fn(),
  clearWatch: jest.fn(),
}

// Mock WebSocket
global.WebSocket = jest.fn()

// Silence console in tests (optional, for cleaner output)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
}

// Increase timeout for async tests
jest.setTimeout(10000)
