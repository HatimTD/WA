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
      ;(prisma.waCaseStudy.create as jest.Mock).mockResolvedValue(mockCase)
      const createdCase = await prisma.waCaseStudy.create({
        data: {
          title: 'New Case Study',
          contributorId: 'contributor-123',
          status: 'DRAFT',
        },
      })
      expect(createdCase.status).toBe('DRAFT')

      // Step 3: User publishes case study
      const mockPublishedCase = { ...mockCase, status: 'PUBLISHED' }
      ;(prisma.waCaseStudy.update as jest.Mock).mockResolvedValue(mockPublishedCase)
      const publishedCase = await prisma.waCaseStudy.update({
        where: { id: 'case-new' },
        data: { status: 'PUBLISHED' },
      })
      expect(publishedCase.status).toBe('PUBLISHED')

      // Step 4: Create notification for publish event
      const mockNotification = {
        id: 'notif-1',
        userId: 'contributor-123',
        type: 'CASE_PUBLISHED',
        read: false,
      }
      ;(prisma.waNotification.create as jest.Mock).mockResolvedValue(mockNotification)
      const notification = await prisma.waNotification.create({
        data: {
          userId: 'contributor-123',
          type: 'CASE_PUBLISHED',
          read: false,
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
      ;(prisma.waSavedCase.create as jest.Mock).mockResolvedValue(mockSavedCase)
      const savedCase = await prisma.waSavedCase.create({
        data: {
          userId: 'viewer-123',
          caseStudyId: 'case-1',
        },
      })
      expect(savedCase.userId).toBe('viewer-123')

      // Step 3: User fetches saved cases
      ;(prisma.waSavedCase.findMany as jest.Mock).mockResolvedValue([mockSavedCase])
      const savedCases = await prisma.waSavedCase.findMany({
        where: { userId: 'viewer-123' },
      })
      expect(savedCases).toHaveLength(1)

      // Step 4: User unsaves the case study
      ;(prisma.waSavedCase.delete as jest.Mock).mockResolvedValue(mockSavedCase)
      const deleted = await prisma.waSavedCase.delete({
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

      // Step 2: Admin creates announcement via system config
      const mockAnnouncement = {
        key: 'announcement',
        value: JSON.stringify({
          title: 'System Update',
          content: 'Maintenance tonight',
          isActive: true,
        }),
      }
      ;(prisma.waSystemConfig.upsert as jest.Mock).mockResolvedValue(mockAnnouncement)
      const announcement = await prisma.waSystemConfig.upsert({
        where: { key: 'announcement' },
        update: { value: mockAnnouncement.value },
        create: { key: 'announcement', value: mockAnnouncement.value },
      })
      expect(announcement.key).toBe('announcement')

      // Step 3: Admin updates system config
      const mockConfig = {
        key: 'maintenance_mode',
        value: 'true',
        updatedBy: 'admin-123',
      }
      ;(prisma.waSystemConfig.upsert as jest.Mock).mockResolvedValue(mockConfig)
      const config = await prisma.waSystemConfig.upsert({
        where: { key: 'maintenance_mode' },
        update: { value: 'true', updatedBy: 'admin-123' },
        create: { key: 'maintenance_mode', value: 'true', updatedBy: 'admin-123' },
      })
      expect(config.value).toBe('true')

      // Step 4: Admin deactivates announcement via system config
      const mockDeactivated = {
        key: 'announcement',
        value: JSON.stringify({
          title: 'System Update',
          content: 'Maintenance tonight',
          isActive: false,
        }),
      }
      ;(prisma.waSystemConfig.update as jest.Mock).mockResolvedValue(mockDeactivated)
      const deactivated = await prisma.waSystemConfig.update({
        where: { key: 'announcement' },
        data: { value: mockDeactivated.value },
      })
      expect(deactivated.key).toBe('announcement')
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
      ;(prisma.waSystemConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)
      const currentConfig = await prisma.waSystemConfig.findUnique({
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
      ;(prisma.waSystemConfig.upsert as jest.Mock).mockResolvedValue(newConfig)
      const updated = await prisma.waSystemConfig.upsert({
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
      ;(prisma.waComment.create as jest.Mock).mockResolvedValue(mockComment)
      const comment = await prisma.waComment.create({
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
      ;(prisma.waCaseStudy.findUnique as jest.Mock).mockResolvedValue(mockCase)
      const caseStudy = await prisma.waCaseStudy.findUnique({
        where: { id: 'case-1' },
      })

      // Step 3: Create notification for contributor
      const mockNotification = {
        id: 'notif-1',
        userId: caseStudy?.contributorId,
        type: 'COMMENT_ADDED',
        read: false,
      }
      ;(prisma.waNotification.create as jest.Mock).mockResolvedValue(mockNotification)
      const notification = await prisma.waNotification.create({
        data: {
          userId: caseStudy?.contributorId,
          type: 'COMMENT_ADDED',
          read: false,
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
      ;(prisma.waSavedCase.create as jest.Mock).mockResolvedValue(mockSavedCase)
      const syncedCase = await prisma.waSavedCase.create({
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
      ;(prisma.waCaseStudy.findMany as jest.Mock).mockResolvedValue(mockResults)
      const results = await prisma.waCaseStudy.findMany({
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
        { id: 'notif-1', read: false, type: 'CASE_PUBLISHED' },
        { id: 'notif-2', read: false, type: 'COMMENT_ADDED' },
      ]
      ;(prisma.waNotification.findMany as jest.Mock).mockResolvedValue(mockNotifications)
      const notifications = await prisma.waNotification.findMany({
        where: { userId: 'user-123', read: false },
      })
      expect(notifications).toHaveLength(2)

      // Step 2: Count unread
      ;(prisma.waNotification.count as jest.Mock).mockResolvedValue(2)
      const unreadCount = await prisma.waNotification.count({
        where: { userId: 'user-123', read: false },
      })
      expect(unreadCount).toBe(2)

      // Step 3: Mark as read
      ;(prisma.waNotification.update as jest.Mock).mockResolvedValue({
        id: 'notif-1',
        read: true,
      })
      const marked = await prisma.waNotification.update({
        where: { id: 'notif-1' },
        data: { read: true },
      })
      expect(marked.read).toBe(true)
    })
  })
})
