'use client';

import { useEffect } from 'react';

const RESORT_ADMIN_EMAIL = 'uuu1946@gmail.com';

export default function AdminLoginEmailFix() {
  useEffect(() => {
    const syncEmail = () => {
      const input = document.querySelector('.admin-login input[type="email"]');
      if (!input) return false;

      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;

      if (setter) setter.call(input, RESORT_ADMIN_EMAIL);
      else input.value = RESORT_ADMIN_EMAIL;

      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    };

    if (syncEmail()) return;

    const observer = new MutationObserver(() => {
      if (syncEmail()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
