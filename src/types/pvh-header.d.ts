import type { DetailedHTMLProps, HTMLAttributes } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pvh-header': DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          'logo-url'?: string;
          'app-name'?: string;
          'nav-json'?: string;
          'account-json'?: string;
          'no-default-nav'?: boolean | string;
        },
        HTMLElement
      >;
    }
  }
}
