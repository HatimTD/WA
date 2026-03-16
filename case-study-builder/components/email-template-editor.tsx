'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Code,
  Eye,
  Type,
  Heading as HeadingIcon,
  Image,
  Link as LinkIcon,
  Square,
  Plus,
  Trash2,
  Mail,
  Send,
} from 'lucide-react'
import { toast } from 'sonner'

interface EmailTemplateEditorProps {
  value: string
  onChange: (value: string) => void
  variables: string[]
  templateType: string
  logoUrl?: string
}

type ComponentType = 'heading' | 'text' | 'button' | 'image' | 'spacer'

interface EmailComponent {
  id: string
  type: ComponentType
  content: string
  style?: Record<string, string>
}

export function EmailTemplateEditor({
  value,
  onChange,
  variables,
  templateType,
  logoUrl,
}: EmailTemplateEditorProps) {
  const [mode, setMode] = useState<'visual' | 'code'>('visual')
  const [components, setComponents] = useState<EmailComponent[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Parse HTML to components on mount or when switching to visual mode
  useEffect(() => {
    if (mode === 'visual' && value) {
      parseHtmlToComponents(value)
    }
  }, [mode])

  // Generate HTML from components when in visual mode
  useEffect(() => {
    if (mode === 'visual') {
      const html = generateHtmlFromComponents()
      onChange(html)
    }
  }, [components, mode])

  const parseHtmlToComponents = (html: string) => {
    // Simple parsing for now - extract text content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    const parsedComponents: EmailComponent[] = []
    const elements = tempDiv.querySelectorAll('h1, h2, p, a, img, div')

    elements.forEach((el, index) => {
      if (el.tagName === 'H1' || el.tagName === 'H2') {
        parsedComponents.push({
          id: `component-${index}`,
          type: 'heading',
          content: el.textContent || '',
        })
      } else if (el.tagName === 'P') {
        parsedComponents.push({
          id: `component-${index}`,
          type: 'text',
          content: el.textContent || '',
        })
      } else if (el.tagName === 'A') {
        parsedComponents.push({
          id: `component-${index}`,
          type: 'button',
          content: el.textContent || '',
        })
      } else if (el.tagName === 'IMG') {
        parsedComponents.push({
          id: `component-${index}`,
          type: 'image',
          content: (el as HTMLImageElement).src || '',
        })
      }
    })

    if (parsedComponents.length > 0) {
      setComponents(parsedComponents)
    }
  }

  const generateHtmlFromComponents = () => {
    if (components.length === 0) return value

    const componentHtml = components
      .map((comp) => {
        switch (comp.type) {
          case 'heading':
            return `<h1 style="color: #333; font-size: 24px; font-weight: bold; margin: 24px 0;">${comp.content}</h1>`
          case 'text':
            return `<p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">${comp.content}</p>`
          case 'button':
            return `<a href="#" style="background-color: #0070f3; border-radius: 5px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 24px; margin: 16px 0;">${comp.content}</a>`
          case 'image':
            return `<img src="${comp.content}" alt="Image" style="max-width: 100%; height: auto; margin: 16px 0;" />`
          case 'spacer':
            return `<div style="height: ${comp.content || '32'}px;"></div>`
          default:
            return ''
        }
      })
      .join('\n')

    return componentHtml
  }

  const addComponent = (type: ComponentType) => {
    const newComponent: EmailComponent = {
      id: `component-${Date.now()}`,
      type,
      content: type === 'heading'
        ? 'New Heading'
        : type === 'text'
        ? 'New paragraph text. Click to edit.'
        : type === 'button'
        ? 'Click Here'
        : type === 'spacer'
        ? '32'
        : '',
    }
    setComponents([...components, newComponent])
  }

  const updateComponent = (id: string, content: string) => {
    setComponents(
      components.map((comp) =>
        comp.id === id ? { ...comp, content } : comp
      )
    )
  }

  const removeComponent = (id: string) => {
    setComponents(components.filter((comp) => comp.id !== id))
  }

  const insertVariable = (variable: string) => {
    if (mode === 'code') {
      const textarea = document.getElementById('code-editor') as HTMLTextAreaElement
      if (textarea) {
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const newValue = value.substring(0, start) + `{{${variable}}}` + value.substring(end)
        onChange(newValue)
        setTimeout(() => {
          textarea.focus()
          textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
        }, 0)
      }
    }
  }

  const handlePreview = async () => {
    try {
      const response = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: value,
          logoUrl,
          templateType,
        }),
      })

      if (response.ok) {
        const { html } = await response.json()
        setPreviewHtml(html)
        setShowPreview(true)
      } else {
        toast.error('Failed to generate preview')
      }
    } catch (error) {
      console.error('Preview error:', error)
      setPreviewHtml(value)
      setShowPreview(true)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          html: value,
          logoUrl,
          templateType,
        }),
      })

      if (response.ok) {
        toast.success(`Test email sent to ${testEmail}`)
        setTestEmail('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send test email')
      }
    } catch (error) {
      console.error('Send test error:', error)
      toast.error('Failed to send test email')
    } finally {
      setIsSendingTest(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle and Actions */}
      <div className="flex items-center justify-between">
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'visual' | 'code')}>
          <TabsList>
            <TabsTrigger value="visual">
              <Eye className="h-4 w-4 mr-2" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-2" />
              Code Editor
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      {/* Variables */}
      {variables.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-xs text-muted-foreground">Available variables:</Label>
            {variables.map((variable) => (
              <Button
                key={variable}
                variant="secondary"
                size="sm"
                className="h-6 text-xs"
                onClick={() => insertVariable(variable)}
              >
                {`{{${variable}}}`}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Visual Editor */}
      {mode === 'visual' && (
        <div className="space-y-4">
          {/* Component Toolbar */}
          <Card className="p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs text-muted-foreground">Add component:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addComponent('heading')}
              >
                <HeadingIcon className="h-4 w-4 mr-2" />
                Heading
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addComponent('text')}
              >
                <Type className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addComponent('button')}
              >
                <Square className="h-4 w-4 mr-2" />
                Button
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addComponent('image')}
              >
                <Image className="h-4 w-4 mr-2" />
                Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addComponent('spacer')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Spacer
              </Button>
            </div>
          </Card>

          {/* Components List */}
          <div className="space-y-2 border rounded-lg p-4 min-h-[300px]">
            {components.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No components yet</p>
                <p className="text-sm">Add components from the toolbar above</p>
              </div>
            ) : (
              components.map((component) => (
                <Card key={component.id} className="p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground capitalize">
                        {component.type}
                      </Label>
                      {component.type === 'image' ? (
                        <Input
                          value={component.content}
                          onChange={(e) => updateComponent(component.id, e.target.value)}
                          placeholder="Image URL"
                          className="mt-1"
                        />
                      ) : component.type === 'spacer' ? (
                        <Input
                          type="number"
                          value={component.content}
                          onChange={(e) => updateComponent(component.id, e.target.value)}
                          placeholder="Height in pixels"
                          className="mt-1"
                        />
                      ) : (
                        <Textarea
                          value={component.content}
                          onChange={(e) => updateComponent(component.id, e.target.value)}
                          rows={component.type === 'heading' ? 1 : 3}
                          className="mt-1"
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeComponent(component.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Code Editor */}
      {mode === 'code' && (
        <Textarea
          id="code-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={15}
          className="font-mono text-sm"
          placeholder="Enter HTML content here..."
        />
      )}

      {/* Test Email Section */}
      <Card className="p-4">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Send Test Email</Label>
          <p className="text-xs text-muted-foreground">
            Note: Using onboarding@resend.dev can only send to test addresses.
            Try: delivered@resend.dev or verify your own domain for production use.
          </p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address or use delivered@resend.dev"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSendTest}
              disabled={isSendingTest || !testEmail}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingTest ? 'Sending...' : 'Send Test'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestEmail('delivered@resend.dev')}
            >
              Use Test Address
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestEmail('tidihatim@gmail.com')}
            >
              Use My Email
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Email Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <div className="p-4">
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[600px] border rounded"
                title="Email Preview"
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
