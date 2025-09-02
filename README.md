# React Context Store with Shallow Selector

A lightweight, fully-typed React store utility with context integration and shallow selector support. Designed for efficient, client-friendly state management with minimal re-renders.

## Features

- `useContextStore`: Creates a stable store reference for any value. Only notifies listeners whose selected slice changes.
- `useShallowSelector`: Selects a slice from a context store with shallow equality, minimizing unnecessary re-renders.
