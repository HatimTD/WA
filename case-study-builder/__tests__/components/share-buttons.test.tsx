/**
 * @fileoverview Share Buttons Component Tests
 * @description Tests for social sharing functionality including WhatsApp and Teams
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { ShareButtons } from '@/components/case-study/share-buttons'

// Mock window.open
const mockWindowOpen = jest.fn()
Object.defineProperty(window, 'open', { value: mockWindowOpen, writable: true })

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn(() => Promise.resolve()) },
  writable: true,
})

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('ShareButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    caseStudyId: 'test-123',
    title: 'Test Case Study',
    description: 'Test description',
    url: 'https://example.com/case/test-123',
  }

  it('renders all share buttons including WhatsApp and Teams', () => {
    render(<ShareButtons {...defaultProps} />)

    expect(screen.getByTitle('Share on LinkedIn')).toBeInTheDocument()
    expect(screen.getByTitle('Share via Email')).toBeInTheDocument()
    expect(screen.getByTitle('Copy link')).toBeInTheDocument()
    expect(screen.getByTitle('Share on WhatsApp')).toBeInTheDocument()
    expect(screen.getByTitle('Share on Microsoft Teams')).toBeInTheDocument()
  })

  it('opens WhatsApp share URL when WhatsApp button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const whatsappButton = screen.getByTitle('Share on WhatsApp')
    fireEvent.click(whatsappButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('api.whatsapp.com/send'),
      '_blank',
      expect.any(String)
    )
  })

  it('opens Teams share URL when Teams button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const teamsButton = screen.getByTitle('Share on Microsoft Teams')
    fireEvent.click(teamsButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('teams.microsoft.com/share'),
      '_blank',
      expect.any(String)
    )
  })

  it('opens LinkedIn share URL when LinkedIn button clicked', () => {
    render(<ShareButtons {...defaultProps} />)

    const linkedinButton = screen.getByTitle('Share on LinkedIn')
    fireEvent.click(linkedinButton)

    expect(mockWindowOpen).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing'),
      '_blank',
      expect.any(String)
    )
  })

  it('copies link to clipboard when copy button clicked', async () => {
    render(<ShareButtons {...defaultProps} />)

    const copyButton = screen.getByTitle('Copy link')
    fireEvent.click(copyButton)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(defaultProps.url)
  })

  it('shows correct button labels', () => {
    render(<ShareButtons {...defaultProps} />)

    expect(screen.getByText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Teams')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Copy Link')).toBeInTheDocument()
  })
})
