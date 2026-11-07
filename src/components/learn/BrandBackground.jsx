import React from 'react';

// Background layers are pure CSS (see learn.css), so no extra DOM is added to a page:
//   1. page colour  2. faint classroom illustration  3. soft white overlay  4. content on top.

/** Wrap a page area to give it the faint classroom illustration behind its content. */
export function ClassroomBackground({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`ap-brandbg ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * Official logo as a faint watermark on a DARK panel (the transparent logo has a white dove and
 * white lettering, which would vanish on a light surface). Decorative only.
 */
export function LogoWatermark({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag className={`ap-wm ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
