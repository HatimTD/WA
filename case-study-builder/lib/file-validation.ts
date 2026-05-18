/**
 * Centralised upload validation.
 *
 * Why this exists: uploads previously trusted `file.type` (the browser-supplied
 * MIME string), which is trivially spoofable. A pentester uploaded a `.php`
 * file by sending it with an allowed Content-Type. This module validates the
 * real file *content* (magic bytes) and the extension, restricts uploads to
 * PDF / image / video only, enforces a 1 GB cap, and scans PDFs for active
 * (dangerous) content before they are ever stored.
 */

export const MAX_UPLOAD_BYTES = 1024 * 1024 * 1024; // 1 GB

export type FileCategory = 'pdf' | 'image' | 'video';

interface SignatureRule {
  category: FileCategory;
  extensions: string[];
  mimePrefixes: string[];
  /** Returns true if the buffer's leading bytes match this file type. */
  match: (bytes: Uint8Array) => boolean;
}

const startsWith = (bytes: Uint8Array, sig: number[], offset = 0): boolean => {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
};

const ascii = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0));

const SIGNATURES: SignatureRule[] = [
  {
    category: 'pdf',
    extensions: ['pdf'],
    mimePrefixes: ['application/pdf'],
    // "%PDF-" — allow a few leading bytes (BOM/whitespace) seen in the wild.
    match: (b) => {
      const head = b.subarray(0, 1024);
      for (let i = 0; i <= head.length - 5; i++) {
        if (startsWith(head, ascii('%PDF-'), i)) return true;
      }
      return false;
    },
  },
  {
    category: 'image',
    extensions: ['jpg', 'jpeg'],
    mimePrefixes: ['image/jpeg', 'image/jpg'],
    match: (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  },
  {
    category: 'image',
    extensions: ['png'],
    mimePrefixes: ['image/png'],
    match: (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  },
  {
    category: 'image',
    extensions: ['gif'],
    mimePrefixes: ['image/gif'],
    match: (b) => startsWith(b, ascii('GIF87a')) || startsWith(b, ascii('GIF89a')),
  },
  {
    category: 'image',
    extensions: ['webp'],
    mimePrefixes: ['image/webp'],
    match: (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('WEBP'), 8),
  },
  {
    category: 'video',
    extensions: ['mp4', 'm4v', 'mov'],
    mimePrefixes: ['video/mp4', 'video/quicktime', 'video/x-m4v'],
    // ISO Base Media: bytes 4..8 == 'ftyp'
    match: (b) => startsWith(b, ascii('ftyp'), 4),
  },
  {
    category: 'video',
    extensions: ['webm', 'mkv'],
    mimePrefixes: ['video/webm', 'video/x-matroska'],
    match: (b) => startsWith(b, [0x1a, 0x45, 0xdf, 0xa3]),
  },
  {
    category: 'video',
    extensions: ['avi'],
    mimePrefixes: ['video/x-msvideo', 'video/avi'],
    match: (b) => startsWith(b, ascii('RIFF')) && startsWith(b, ascii('AVI '), 8),
  },
  {
    category: 'video',
    extensions: ['mpeg', 'mpg'],
    mimePrefixes: ['video/mpeg'],
    match: (b) =>
      startsWith(b, [0x00, 0x00, 0x01, 0xba]) ||
      startsWith(b, [0x00, 0x00, 0x01, 0xb3]),
  },
  {
    category: 'video',
    extensions: ['ogv'],
    mimePrefixes: ['video/ogg'],
    match: (b) => startsWith(b, ascii('OggS')),
  },
];

const getExtension = (name: string): string =>
  name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';

/**
 * Heuristic scan for dangerous active content in a PDF. Booby-trapped PDFs can
 * carry JavaScript, auto-run/launch actions, embedded files or XFA forms. We
 * refuse any PDF containing these so only passive PDFs are ever stored/served.
 *
 * This is a content-rejection heuristic, not a full rebuild-sanitiser
 * (Ghostscript/mupdf is not available in the serverless runtime). It catches
 * the common cases; it can be bypassed by heavy stream obfuscation, so PDFs
 * should additionally be delivered as attachments rather than rendered inline.
 */
export function scanPdfForActiveContent(bytes: Uint8Array): string | null {
  // Latin1 keeps every byte 1:1 so PDF name tokens survive the decode.
  const text = Buffer.from(bytes).toString('latin1');
  const dangerous: Array<[RegExp, string]> = [
    [/\/JavaScript\b/, 'embedded JavaScript (/JavaScript)'],
    [/\/JS\b/, 'embedded JavaScript (/JS)'],
    [/\/Launch\b/, 'launch action (/Launch)'],
    [/\/OpenAction\b/, 'auto-run action (/OpenAction)'],
    [/\/AA\b/, 'additional actions (/AA)'],
    [/\/EmbeddedFiles?\b/, 'embedded file (/EmbeddedFile)'],
    [/\/RichMedia\b/, 'rich media / Flash (/RichMedia)'],
    [/\/XFA\b/, 'XFA form (/XFA)'],
    [/\/JBIG2Decode\b/, 'JBIG2 stream (/JBIG2Decode)'],
  ];
  for (const [re, label] of dangerous) {
    if (re.test(text)) return label;
  }
  return null;
}

export interface ValidationOk {
  ok: true;
  category: FileCategory;
}
export interface ValidationError {
  ok: false;
  error: string;
}

/**
 * Validate an uploaded file by size, extension, declared MIME and — crucially —
 * its real binary signature. `allow` restricts which categories are accepted
 * (e.g. avatars only allow images).
 */
export async function validateUpload(
  file: File,
  allow: FileCategory[] = ['pdf', 'image', 'video']
): Promise<ValidationOk | ValidationError> {
  if (!file || typeof file.arrayBuffer !== 'function') {
    return { ok: false, error: 'No file provided' };
  }

  if (file.size === 0) {
    return { ok: false, error: 'File is empty' };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024 * 1024)} GB limit.`,
    };
  }

  const ext = getExtension(file.name);
  const declaredMime = (file.type || '').toLowerCase();

  // Read only the header for signature sniffing (cheap, avoids buffering 1 GB).
  const headerBuf = new Uint8Array(
    await file.slice(0, 4100).arrayBuffer()
  );

  const matched = SIGNATURES.find((rule) => rule.match(headerBuf));

  if (!matched) {
    return {
      ok: false,
      error:
        'Unsupported or unrecognised file. Only PDF, image and video files are allowed.',
    };
  }

  if (!allow.includes(matched.category)) {
    return {
      ok: false,
      error: `${matched.category.toUpperCase()} files are not allowed here.`,
    };
  }

  // Extension must agree with the detected content (blocks shell.php renamed
  // or disguised as an allowed type).
  if (ext && !matched.extensions.includes(ext)) {
    return {
      ok: false,
      error: `File extension ".${ext}" does not match its actual content.`,
    };
  }
  if (!ext) {
    return { ok: false, error: 'File must have a valid extension.' };
  }

  // Declared MIME, when present, must be consistent with the real content.
  if (
    declaredMime &&
    !matched.mimePrefixes.some((m) => declaredMime === m)
  ) {
    return {
      ok: false,
      error: 'Declared file type does not match its actual content.',
    };
  }

  // PDF active-content rejection ("sanitisation" before upload).
  if (matched.category === 'pdf') {
    const full = new Uint8Array(await file.arrayBuffer());
    const finding = scanPdfForActiveContent(full);
    if (finding) {
      return {
        ok: false,
        error: `This PDF was rejected for security reasons: it contains ${finding}. Please upload a clean PDF (print/export to PDF to remove active content).`,
      };
    }
  }

  return { ok: true, category: matched.category };
}
