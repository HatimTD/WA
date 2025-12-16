// Learn more: https://github.com/testing-library/jest-dom
require('@testing-library/jest-dom')

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    }
  },
  usePathname() {
    return '/'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
  redirect: jest.fn(),
}))

// Mock Next Auth
jest.mock('@/auth', () => ({
  auth: jest.fn(() => Promise.resolve(null)),
}))

// Mock Prisma - using waCamelCase naming convention for WA models
jest.mock('@/lib/prisma', () => ({
  prisma: {
    // NextAuth models (unchanged)
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    account: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    // WA models (with wa prefix)
    waCaseStudy: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
    waSavedCase: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    waComment: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    waCommentReaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    waWeldingProcedure: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    waCostCalculator: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    waSystemConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    waNotification: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    waEmailTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    waAuditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    waDataRetentionPolicy: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    waGdprDeletionRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    waNetSuiteCustomerCache: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    waNetSuiteSyncJob: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    // Transaction support
    $transaction: jest.fn((fn) => fn({
      waCaseStudy: { findMany: jest.fn(), delete: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
      waSavedCase: { deleteMany: jest.fn() },
      waNotification: { deleteMany: jest.fn() },
      waComment: { deleteMany: jest.fn() },
      session: { deleteMany: jest.fn() },
      account: { deleteMany: jest.fn() },
      user: { delete: jest.fn() },
    })),
  },
}))

// Mock Cloudinary
jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}))

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}))

// Mock idb (IndexedDB)
jest.mock('idb', () => ({
  openDB: jest.fn(() => Promise.resolve({
    get: jest.fn(),
    getAll: jest.fn(() => []),
    put: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    transaction: jest.fn(() => ({
      objectStore: jest.fn(() => ({
        get: jest.fn(),
        getAll: jest.fn(() => []),
        put: jest.fn(),
        delete: jest.fn(),
        clear: jest.fn(),
      })),
      done: Promise.resolve(),
    })),
  })),
  deleteDB: jest.fn(() => Promise.resolve()),
}))

// Mock Service Worker and IndexedDB
global.navigator = {
  ...global.navigator,
  serviceWorker: {
    register: jest.fn(() => Promise.resolve({ update: jest.fn() })),
    controller: {
      postMessage: jest.fn(),
    },
  },
  onLine: true,
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return []
  }
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Suppress console errors during tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
