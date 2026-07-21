import React from 'react'

/**
 * Hero headline with a kinetic word entrance (SSR markup + CSS only).
 * Plain-space text nodes between the inline-block spans keep natural
 * RTL wrapping intact; .hero-word animates opacity/transform only (no CLS)
 * and is disabled by the global reduced-motion rule.
 */
export const HeroHeadline: React.FC<{ text: string }> = ({ text }) => (
  <h1 className="text-4xl md:text-7xl font-display font-extrabold text-surface tracking-tight leading-none drop-shadow-md">
    {text.split(' ').map((word, i) => [
      i > 0 && ' ',
      <span
        key={`${word}-${i}`}
        className="hero-word"
        style={{ animationDelay: `${i * 110}ms` }}
      >
        {word}
      </span>
    ])}
  </h1>
)
