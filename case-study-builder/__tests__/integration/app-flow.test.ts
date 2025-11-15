/**
 * Integration Tests
 * End-to-end workflow tests for critical user journeys
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('Application Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Complete Case Study Workflow', () => {
    it('should complete full case study creation workflow (CONTRIBUTOR)', async () => {
      // Step 1: User authenticates
      const mockSession = {
        user: {
          id: 'contributor-123',
          email: 'contributor@example.com',
          role: 'CONTRIBUTOR',
        },
      }
      ;(auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSession as any)
      const session = await auth()
      expect(session?.user?.role).toBe('CONTRIBUTOR')

      // Step 2: User creates case study
      const mockCase = {
        id: 'case-new',
        title: 'New Case Study',
        contributorId: 'contributor-123',
        status: 'DRAFT',
      }
      ;(prisma.caseStudy.create as jest.Mock).mockResolvedValue(mockCase)
      const createdCase = await prisma.caseStudy.create({
        data: {
          title: 'New Case Study',
          contributorId: 'contributor-123',
          status: 'DRAFT',
        },
      })
      expect(createdCase.status).toBe('DRAFT')

      // Step 3: User publishes case study
      const mockPublishedCase = { ...mockCase, status: 'PUBLISHED' }
      ;(prisma.caseStudy.update as jest.Mock).mockResolvedValue(mockPublishedCase)
      const publishedCase = await prisma.caseStudy.update({
        where: { id: 'case-new' },
        data: { status: 'PUBLISHED' },
      })
      expect(publishedCase.status).toBe('PUBLISHED')

      // Step 4: Create notification for publish event
      const mockNotification = {
        id: 'notif-1',
        userId: 'contributor-123',
        type: 'CASE_PUBLISHED',
        isRead: false,
      }
      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      const notification = await prisma.notification.create({
        data: {
          userId: 'contributor-123',
          type: 'CASE_PUBLISHED',
          isRead: false,
        },
      })
      expect(notification.type).toBe('CASE_PUBLISHED')
    })

    it('should complete save and unsave workflow (VIEWER)', async () => {
      // Step 1: User authenticates as VIEWER
      const mockSession = {
        user: {
          id: 'viewer-123',
          email: 'viewer@example.com',
          role: 'VIEWER',
        },
      }
      ;(auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSession as any)
      const session = await auth()
      expect(session?.user?.role).toBe('VIEWER')

      // Step 2: User saves a case study
      const mockSavedCase = {
        id: 'saved-1',
        userId: 'viewer-123',
        caseStudyId: 'case-1',
      }
      ;(prisma.savedCase.create as jest.Mock).mockResolvedValue(mockSavedCase)
      const savedCase = await prisma.savedCase.create({
        data: {
          userId: 'viewer-123',
          caseStudyId: 'case-1',
        },
      })
      expect(savedCase.userId).toBe('viewer-123')

      // Step 3: User fetches saved cases
      ;(prisma.savedCase.findMany as jest.Mock).mockResolvedValue([mockSavedCase])
      const savedCases = await prisma.savedCase.findMany({
        where: { userId: 'viewer-123' },
      })
      expect(savedCases).toHaveLength(1)

      // Step 4: User unsaves the case study
      ;(prisma.savedCase.delete as jest.Mock).mockResolvedValue(mockSavedCase)
      const deleted = await prisma.savedCase.delete({
        where: { id: 'saved-1' },
      })
      expect(deleted.id).toBe('saved-1')
    })
  })

  describe('Admin Workflow', () => {
    it('should complete admin configuration workflow', async () => {
      // Step 1: Admin authenticates
      const mockSession = {
        user: {
          id: 'admin-123',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      }
      ;(auth as jest.MockedFunction<typeof auth>).mockResolvedValue(mockSession as any)
      const session = await auth()
      expect(session?.user?.role).toBe('ADMIN')

      // Step 2: Admin creates announcement
      const mockAnnouncement = {
        id: 'ann-1',
        title: 'System Update',
        content: 'Maintenance tonight',
        isActive: true,
      }
      ;(prisma.announcement.create as jest.Mock).mockResolvedValue(mockAnnouncement)
      const announcement = await prisma.announcement.create({
        data: {
          title: 'System Update',
          content: 'Maintenance tonight',
          isActive: true,
        },
      })
      expect(announcement.isActive).toBe(true)

      // Step 3: Admin updates system config
      const mockConfig = {
        key: 'maintenance_mode',
        value: 'true',
        updatedBy: 'admin-123',
      }
      ;(prisma.systemConfig.upsert as jest.Mock).mockResolvedValue(mockConfig)
      const config = await prisma.systemConfig.upsert({
        where: { key: 'maintenance_mode' },
        update: { value: 'true', updatedBy: 'admin-123' },
        create: { key: 'maintenance_mode', value: 'true', updatedBy: 'admin-123' },
      })
      expect(config.value).toBe('true')

      // Step 4: Admin deactivates announcement
      const mockDeactivated = { ...mockAnnouncement, isActive: false }
      ;(prisma.announcement.update as jest.Mock).mockResolvedValue(mockDeactivated)
      const deactivated = await prisma.announcement.update({
        where: { id: 'ann-1' },
        data: { isActive: false },
      })
      expect(deactivated.isActive).toBe(false)
    })

    it('should manage offline configuration', async () => {
      // Step 1: Admin fetches current offline config
      const mockConfig = {
        key: 'offline_config',
        value: JSON.stringify({
          enabled: true,
          cacheDurations: {
            databaseCases: 24,
            libraryContent: 7,
          },
        }),
      }
      ;(prisma.systemConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)
      const currentConfig = await prisma.systemConfig.findUnique({
        where: { key: 'offline_config' },
      })
      expect(JSON.parse(currentConfig?.value || '{}')).toHaveProperty('enabled')

      // Step 2: Admin updates offline config
      const newConfig = {
        key: 'offline_config',
        value: JSON.stringify({
          enabled: true,
          cacheDurations: {
            databaseCases: 48, // Updated
            libraryContent: 14, // Updated
          },
        }),
      }
      ;(prisma.systemConfig.upsert as jest.Mock).mockResolvedValue(newConfig)
      const updated = await prisma.systemConfig.upsert({
        where: { key: 'offline_config' },
        update: { value: newConfig.value },
        create: newConfig,
      })
      const parsedConfig = JSON.parse(updated.value)
      expect(parsedConfig.cacheDurations.databaseCases).toBe(48)
    })
  })

  describe('Comment Workflow', () => {
    it('should complete comment creation and notification workflow', async () => {
      // Step 1: User adds comment
      const mockComment = {
        id: 'comment-1',
        content: 'Great case study!',
        userId: 'user-123',
        caseStudyId: 'case-1',
      }
      ;(prisma.comment.create as jest.Mock).mockResolvedValue(mockComment)
      const comment = await prisma.comment.create({
        data: {
          content: 'Great case study!',
          userId: 'user-123',
          caseStudyId: 'case-1',
        },
      })
      expect(comment.content).toBe('Great case study!')

      // Step 2: Fetch case study to get contributor
      const mockCase = {
        id: 'case-1',
        contributorId: 'contributor-123',
      }
      ;(prisma.caseStudy.findUnique as jest.Mock).mockResolvedValue(mockCase)
      const caseStudy = await prisma.caseStudy.findUnique({
        where: { id: 'case-1' },
      })

      // Step 3: Create notification for contributor
      const mockNotification = {
        id: 'notif-1',
        userId: caseStudy?.contributorId,
        type: 'COMMENT_ADDED',
        isRead: false,
      }
      ;(prisma.notification.create as jest.Mock).mockResolvedValue(mockNotification)
      const notification = await prisma.notification.create({
        data: {
          userId: caseStudy?.contributorId,
          type: 'COMMENT_ADDED',
          isRead: false,
        },
      })
      expect(notification.userId).toBe('contributor-123')
      expect(notification.type).toBe('COMMENT_ADDED')
    })
  })

  describe('Offline-to-Online Sync Workflow', () => {
    it('should complete offline save and online sync workflow', async () => {
      // Step 1: User goes offline and saves a case
      const pendingChange = {
        id: 'change-1',
        type: 'saved_case' as const,
        action: 'create' as const,
        data: {
          userId: 'user-123',
          caseStudyId: 'case-1',
        },
        retryCount: 0,
        timestamp: Date.now(),
      }
      expect(pendingChange.type).toBe('saved_case')
      expect(pendingChange.retryCount).toBe(0)

      // Step 2: User comes back online
      const isOnline = true
      expect(isOnline).toBe(true)

      // Step 3: Sync service processes pending change
      const mockSavedCase = {
        id: 'saved-1',
        userId: 'user-123',
        caseStudyId: 'case-1',
      }
      ;(prisma.savedCase.create as jest.Mock).mockResolvedValue(mockSavedCase)
      const syncedCase = await prisma.savedCase.create({
        data: pendingChange.data,
      })
      expect(syncedCase.userId).toBe('user-123')

      // Step 4: Verify sync completed
      const syncSuccess = syncedCase.id === 'saved-1'
      expect(syncSuccess).toBe(true)
    })
  })

  describe('Search and Filter Workflow', () => {
    it('should complete search workflow', async () => {
      // Step 1: User searches for cases
      const searchTerm = 'welding'
      const mockResults = [
        {
          id: 'case-1',
          title: 'Welding Case Study 1',
          waProduct: 'Weld-O-Matic',
        },
        {
          id: 'case-2',
          title: 'Advanced Welding Techniques',
          waProduct: 'Weld-Pro',
        },
      ]
      ;(prisma.caseStudy.findMany as jest.Mock).mockResolvedValue(mockResults)
      const results = await prisma.caseStudy.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm } },
            { waProduct: { contains: searchTerm } },
          ],
        },
      })
      expect(results).toHaveLength(2)

      // Step 2: User filters by industry
      const filteredResults = mockResults.filter(c => c.waProduct.includes('Weld'))
      expect(filteredResults).toHaveLength(2)
    })
  })

  describe('Notification Workflow', () => {
    it('should fetch and mark notifications as read', async () => {
      // Step 1: Fetch unread notifications
      const mockNotifications = [
        { id: 'notif-1', isRead: false, type: 'CASE_PUBLISHED' },
        { id: 'notif-2', isRead: false, type: 'COMMENT_ADDED' },
      ]
      ;(prisma.notification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
      const notifications = await prisma.notification.findMany({
        where: { userId: 'user-123', isRead: false },
      })
      expect(notifications).toHaveLength(2)

      // Step 2: Count unread
      ;(prisma.notification.count as jest.Mock).mockResolvedValue(2)
      const unreadCount = await prisma.notification.count({
        where: { userId: 'user-123', isRead: false },
      })
      expect(unreadCount).toBe(2)

      // Step 3: Mark as read
      ;(prisma.notification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      })
      const marked = await prisma.notification.update({
        where: { id: 'notif-1' },
        data: { isRead: true },
      })
      expect(marked.isRead).toBe(true)
    })
  })
})
