'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link, { LinkProps } from 'next/link';

interface IOSSafeLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}

/**
 * Custom Link component that handles iOS PWA standalone mode properly
 * Falls back to window.location.replace() on iOS standalone mode
 */
export function IOSSafeLink({ children, href, className, prefetch, ...props }: IOSSafeLinkProps) {
  const [isIOSStandalone, setIsIOSStandalone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Detect iOS standalone mode
    const standalone = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    setIsIOSStandalone(standalone);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only handle in iOS standalone mode
    if (isIOSStandalone) {
      e.preventDefault();
      e.stopPropagation();

      const url = typeof href === 'string' ? href : href.pathname || '/';
      console.log('[IOSSafeLink] Navigating to:', url);

      // Use window.location.replace for iOS standalone mode
      // This maintains standalone mode better than router.push()
      window.location.replace(url);

      return false;
    }

    // In normal browser mode, use default Link behavior
  };

  // In iOS standalone mode, render a simple anchor tag
  if (isIOSStandalone) {
    // Filter out Next.js-specific props that don't belong on anchor tags
    const { as, replace, scroll, shallow, passHref, locale, legacyBehavior, ...anchorProps } = props;

    return (
      <a
        href={typeof href === 'string' ? href : href.pathname || '/'}
        className={className}
        onClick={handleClick}
        {...anchorProps}
      >
        {children}
      </a>
    );
  }

  // In normal mode, use Next.js Link
  return (
    <Link href={href} className={className} prefetch={prefetch} {...props}>
      {children}
    </Link>
  );
}