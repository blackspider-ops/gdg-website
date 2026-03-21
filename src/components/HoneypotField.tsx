// Honeypot field component for bot detection
// MEDIUM FIX: Add hidden field to catch bots

import React from 'react';

interface HoneypotFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Honeypot field - invisible to humans, visible to bots
 * If this field is filled, the submission is likely from a bot
 */
export const HoneypotField: React.FC<HoneypotFieldProps> = ({ value, onChange }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: '-9999px',
        width: '1px',
        height: '1px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor="website_url">
        Website (leave blank)
      </label>
      <input
        type="text"
        id="website_url"
        name="website_url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
};

/**
 * Check if honeypot was triggered (bot detected)
 */
export function isBot(honeypotValue: string): boolean {
  return honeypotValue.trim().length > 0;
}
