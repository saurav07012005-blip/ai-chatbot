import React from 'react';

export default function QuickPrompts({ onSelectPrompt, disabled }) {
  const prompts = [
    { label: "💡 Explain polymorphism in Java", text: "Explain polymorphism in Java with a code example." },
    { label: "⚡ Binary search in C++", text: "Write a C++ function to perform binary search on a sorted array." },
    { label: "🔍 DBMS normalization", text: "What is 3NF in DBMS? Explain with an example." },
    { label: "🧮 Solve math problem", text: "What is the derivative of x^3 + 2x^2 - 5x + 7?" }
  ];

  return (
    <div className="quick-prompts-container">
      {prompts.map((p, idx) => (
        <button
          key={idx}
          className="quick-prompt-chip"
          onClick={() => !disabled && onSelectPrompt(p.text)}
          disabled={disabled}
        >
          <span>{p.label}</span>
        </button>
      ))}
    </div>
  );
}
