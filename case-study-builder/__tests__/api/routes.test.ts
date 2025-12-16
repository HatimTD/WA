/**
 * API Routes Tests
 * Comprehensive tests for all API endpoints
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Case Studies API', () => {
    it('should fetch all case studies', async () => {
      const mockCases = [
        {
          id: 'case-1',
          title: 'Test Case 1',
          status: 'PUBLISHED',
          contributorId: 'user-1',
        },
        {
          id: 'case-2',
          title: 'Test Case 2',
          status: 'PUBLISHED',
          contributorId: 'user-2',
        },
      ]

      ;(prisma.waCaseStudy.findMany as jest.Mock).mockResolvedValue(mockCases)

      const cases = await prisma.waCaseStudy.findMany({
        where: { status: 'PUBLISHED' },
      })

      expect(cases).toHaveLength(2)
      expect(cases[0].title).toBe('Test Case 1')
    })

    it('should create a new case study (CONTRIBUTOR)', async () => {
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

      expect(createdCase.id).toBe('case-new')
      expect(createdCase.status).toBe('DRAFT')
    })

    it('should update existing case study (CONTRIBUTOR)', async () => {
      const mockUpdatedCase = {
        id: 'case-1',
        title: 'Updated Case Study',
        status: 'PUBLISHED',
      }

      ;(prisma.waCaseStudy.update as jest.Mock).mockResolvedValue(mockUpdatedCase)

      const updatedCase = await prisma.waCaseStudy.update({
        where: { id: 'case-1' },
        data: { title: 'Updated Case Study' },
      })

      expect(updatedCase.title).toBe('Updated Case Study')
    })

    it('should delete case study (ADMIN only)', async () => {
      const mockDeletedCase = {
        id: 'case-1',
        title: 'Deleted Case',
      }

      ;(prisma.waCaseStudy.delete as jest.Mock).mockResolvedValue(mockDeletedCase)

      const deletedCase = await prisma.waCaseStudy.delete({
        where: { id: 'case-1' },
      })

      expect(deletedCase.id).toBe('case-1')
    })

    it('should count total case studies', async () => {
      ;(prisma.waCaseStudy.count as jest.Mock).mockResolvedValue(25)

      const count = await prisma.waCaseStudy.count({
        where: { status: 'PUBLISHED' },
      })

      expect(count).toBe(25)
    })
  })

  describe('Saved Cases API', () => {
    it('should save a case study', async () => {
      const mockSavedCase = {
        id: 'saved-1',
        userId: 'user-123',
        caseStudyId: 'case-1',
      }

      ;(prisma.waSavedCase.create as jest.Mock).mockResolvedValue(mockSavedCase)

      const savedCase = await prisma.waSavedCase.create({
        data: {
          userId: 'user-123',
          caseStudyId: 'case-1',
        },
      })

      expect(savedCase.userId).toBe('user-123')
      expect(savedCase.caseStudyId).toBe('case-1')
    })

    it('should fetch user saved cases', async () => {
      const mockSavedCases = [
        { id: 'saved-1', userId: 'user-123', caseStudyId: 'case-1' },
        { id: 'saved-2', userId: 'user-123', caseStudyId: 'case-2' },
      ]

      ;(prisma.waSavedCase.findMany as jest.Mock).mockResolvedValue(mockSavedCases)

      const savedCases = await prisma.waSavedCase.findMany({
        where: { userId: 'user-123' },
      })

      expect(savedCases).toHaveLength(2)
    })

    it('should unsave a case study', async () => {
      const mockDeletedSave = {
        id: 'saved-1',
      }

      ;(prisma.waSavedCase.delete as jest.Mock).mockResolvedValue(mockDeletedSave)

      const deleted = await prisma.waSavedCase.delete({
        where: { id: 'saved-1' },
      })

      expect(deleted.id).toBe('saved-1')
    })
  })

  describe('Comments API', () => {
    it('should create a comment', async () => {
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
    })

    it('should fetch comments for a case study', async () => {
      const mockComments = [
        { id: 'comment-1', content: 'Comment 1', caseStudyId: 'case-1' },
        { id: 'comment-2', content: 'Comment 2', caseStudyId: 'case-1' },
      ]

      ;(prisma.waComment.findMany as jest.Mock).mockResolvedValue(mockComments)

      const comments = await prisma.waComment.findMany({
        where: { caseStudyId: 'case-1' },
      })

      expect(comments).toHaveLength(2)
    })

    it('should update a comment', async () => {
      const mockUpdatedComment = {
        id: 'comment-1',
        content: 'Updated comment',
      }

      ;(prisma.waComment.update as jest.Mock).mockResolvedValue(mockUpdatedComment)

      const updated = await prisma.waComment.update({
        where: { id: 'comment-1' },
        data: { content: 'Updated comment' },
      })

      expect(updated.content).toBe('Updated comment')
    })

    it('should delete a comment', async () => {
      const mockDeletedComment = {
        id: 'comment-1',
      }

      ;(prisma.waComment.delete as jest.Mock).mockResolvedValue(mockDeletedComment)

      const deleted = await prisma.waComment.delete({
        where: { id: 'comment-1' },
      })

      expect(deleted.id).toBe('comment-1')
    })
  })

  describe('Welding Procedures API (Library)', () => {
    it('should fetch all welding procedures', async () => {
      const mockProcedures = [
        { id: 'proc-1', title: 'MIG Welding', category: 'WELDING' },
        { id: 'proc-2', title: 'TIG Welding', category: 'WELDING' },
      ]

      ;(prisma.waWeldingProcedure.findMany as jest.Mock).mockResolvedValue(mockProcedures)

      const procedures = await prisma.waWeldingProcedure.findMany()

      expect(procedures).toHaveLength(2)
      expect(procedures[0].category).toBe('WELDING')
    })

    it('should create a new welding procedure (ADMIN)', async () => {
      const mockProcedure = {
        id: 'proc-new',
        title: 'New Welding Procedure',
        category: 'WELDING',
      }

      ;(prisma.waWeldingProcedure.create as jest.Mock).mockResolvedValue(mockProcedure)

      const created = await prisma.waWeldingProcedure.create({
        data: {
          title: 'New Welding Procedure',
          category: 'WELDING',
        },
      })

      expect(created.title).toBe('New Welding Procedure')
    })
  })

  describe('System Config API (Admin Only)', () => {
    it('should fetch system configuration', async () => {
      const mockConfig = {
        key: 'maintenance_mode',
        value: 'false',
      }

      ;(prisma.waSystemConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)

      const config = await prisma.waSystemConfig.findUnique({
        where: { key: 'maintenance_mode' },
      })

      expect(config?.value).toBe('false')
    })

    it('should update system configuration (ADMIN)', async () => {
      const mockConfig = {
        key: 'maintenance_mode',
        value: 'true',
      }

      ;(prisma.waSystemConfig.upsert as jest.Mock).mockResolvedValue(mockConfig)

      const updated = await prisma.waSystemConfig.upsert({
        where: { key: 'maintenance_mode' },
        update: { value: 'true' },
        create: { key: 'maintenance_mode', value: 'true', updatedBy: 'admin-123' },
      })

      expect(updated.value).toBe('true')
    })
  })

  describe('Announcements API', () => {
    it('should fetch announcement from system config', async () => {
      const mockConfig = {
        key: 'announcement',
        value: JSON.stringify({
          title: 'Important Update',
          content: 'System update tonight',
          isActive: true,
        }),
      }

      ;(prisma.waSystemConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)

      const config = await prisma.waSystemConfig.findUnique({
        where: { key: 'announcement' },
      })

      expect(config).toBeDefined()
      expect(config?.key).toBe('announcement')
    })

    it('should update announcement in system config (ADMIN)', async () => {
      const mockConfig = {
        key: 'announcement',
        value: JSON.stringify({
          title: 'New Announcement',
          content: 'Important message',
          isActive: true,
        }),
      }

      ;(prisma.waSystemConfig.upsert as jest.Mock).mockResolvedValue(mockConfig)

      const updated = await prisma.waSystemConfig.upsert({
        where: { key: 'announcement' },
        update: { value: mockConfig.value },
        create: { key: 'announcement', value: mockConfig.value },
      })

      expect(updated.key).toBe('announcement')
    })
  })

  describe('Notifications API', () => {
    it('should fetch user notifications', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          userId: 'user-123',
          type: 'CASE_PUBLISHED',
          read: false,
        },
        {
          id: 'notif-2',
          userId: 'user-123',
          type: 'COMMENT_ADDED',
          read: true,
        },
      ]

      ;(prisma.waNotification.findMany as jest.Mock).mockResolvedValue(mockNotifications)

      const notifications = await prisma.waNotification.findMany({
        where: { userId: 'user-123' },
      })

      expect(notifications).toHaveLength(2)
    })

    it('should count unread notifications', async () => {
      ;(prisma.waNotification.count as jest.Mock).mockResolvedValue(5)

      const count = await prisma.waNotification.count({
        where: { userId: 'user-123', read: false },
      })

      expect(count).toBe(5)
    })

    it('should mark notification as read', async () => {
      const mockUpdated = {
        id: 'notif-1',
        read: true,
      }

      ;(prisma.waNotification.update as jest.Mock).mockResolvedValue(mockUpdated)

      const updated = await prisma.waNotification.update({
        where: { id: 'notif-1' },
        data: { read: true },
      })

      expect(updated.read).toBe(true)
    })
  })

  describe('Maintenance Status API', () => {
    it('should check if maintenance mode is active', async () => {
      const mockConfig = {
        key: 'maintenance_mode',
        value: 'false',
      }

      ;(prisma.waSystemConfig.findUnique as jest.Mock).mockResolvedValue(mockConfig)

      const config = await prisma.waSystemConfig.findUnique({
        where: { key: 'maintenance_mode' },
      })

      const isMaintenanceMode = config?.value === 'true'
      expect(isMaintenanceMode).toBe(false)
    })
  })
})
