<div align="center">
  <h1>⚡ React Hooks Core</h1>
  <p><strong>Production-ready React hooks that solve real-world problems</strong></p>
  
  [![NPM Version](https://img.shields.io/npm/v/react-hooks-core.svg)](https://www.npmjs.com/package/react-hooks-core)
  [![License](https://img.shields.io/npm/l/react-hooks-core.svg)](https://github.com/NightDevilPT/react-hooks-core/blob/main/LICENSE)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
  [![Tests](https://img.shields.io/badge/Tests-92%20Passing-success.svg)](https://github.com/NightDevilPT/react-hooks-core)
</div>

---

## 🎯 What is React Hooks Core?

**React Hooks Core** is a comprehensive collection of production-ready React hooks designed to solve common problems you face when building modern React and Next.js applications. Instead of reinventing the wheel for every project, React Hooks Core provides battle-tested, well-documented hooks that work out of the box.

Whether you're building a SaaS platform, e-commerce site, dashboard, or any production application, React Hooks Core helps you ship faster with fewer bugs and better user experiences.

---

## 💼 Built for Production

### Why Production Projects Need React Hooks Core

Every production React application faces the same challenges:

- **Device Detection** - Need to know if users are on mobile, tablet, or desktop to optimize layouts and features
- **Network Monitoring** - Handle offline scenarios gracefully, show connection status, sync data when back online
- **User Activity Tracking** - Implement auto-logout for security, pause expensive operations when idle
- **Responsive Design** - Build adaptive UIs that respond to viewport changes and system preferences
- **Performance Optimization** - Adapt content quality based on network speed, battery level, and device capabilities

**React Hooks Core solves these problems** with hooks that are:
- ✅ **SSR-Compatible** - Works seamlessly with Next.js App Router and Pages Router
- ✅ **Type-Safe** - Full TypeScript support with proper generics and inference
- ✅ **Well-Tested** - Comprehensive test coverage ensuring reliability
- ✅ **Production-Ready** - Used in real-world applications, not just demos
- ✅ **Zero Dependencies** - Lightweight and performant
- ✅ **Tree-Shakeable** - Import only what you need, keep bundle sizes minimal

---

## 🚀 How React Hooks Core Helps Your Production Projects

### ⚡ Faster Development

Stop rewriting the same logic for every project. React Hooks Core provides ready-to-use hooks that handle edge cases, error scenarios, and browser compatibility issues you might miss. Focus on building features, not infrastructure.

### 🐛 Fewer Bugs

Every hook in React Hooks Core is thoroughly tested with comprehensive test suites covering initialization, SSR compatibility, state updates, error handling, cleanup, and edge cases. This means fewer bugs in production and more confidence in your code.

### 📦 Optimized Bundle Size

Tree-shakeable imports mean you only bundle what you use. Zero dependencies keep your bundle size minimal. Perfect for production applications where every kilobyte matters.

### 🎯 Better User Experience

React Hooks Core hooks respect user preferences and device capabilities. Detect system dark mode, respect reduced motion preferences, adapt to network conditions, and optimize for battery life. Your users will notice the difference.

### 🔒 Enhanced Security

Built-in features like idle detection help you implement security best practices like auto-logout, session management, and activity monitoring without additional complexity.

### 🌐 Universal Compatibility

Works with React 18+ and Next.js 13+ (both App Router and Pages Router). SSR-compatible out of the box, so you don't have to worry about hydration mismatches or server-side rendering issues.

---

## ✨ Key Features

- ✅ **TypeScript First** - Full type safety with generics and proper inference
- ✅ **SSR Compatible** - Works seamlessly with Next.js 13+ (App Router & Pages Router)
- ✅ **Tree-Shakeable** - Import only what you need, keep bundle sizes minimal
- ✅ **Zero Dependencies** - Lightweight and performant
- ✅ **Well Tested** - 92+ tests with comprehensive coverage on critical hooks
- ✅ **Production Ready** - Used in real-world applications
- ✅ **Accessibility First** - Respects user preferences (reduced motion, contrast, etc.)
- ✅ **Error Resilient** - Graceful fallbacks and comprehensive error handling
- ✅ **Performance Optimized** - Minimal re-renders and efficient event handling

---

## 📦 Installation

```bash
npm install react-hooks-core
```

```bash
yarn add react-hooks-core
```

```bash
pnpm add react-hooks-core
```

---

## 🚀 Quick Start

All hooks work out of the box with zero configuration. Simply import what you need:

```tsx
import { useDeviceDetect, useOnline, useIdle, useMediaQuery } from 'react-hooks-core'
```

Tree-shakeable imports mean you only bundle what you use, keeping your production bundle size minimal.

---

## 📚 Available Hooks

React Hooks Core provides hooks across multiple categories to help you build production-ready applications:

### 🌐 Browser & Device Hooks

Monitor device capabilities, network status, user activity, and system preferences to build adaptive, responsive applications.

- **[Device Detection](src/browser/docs/useDeviceDetect.md)** - Detect device type, operating system, and browser environment
- **[Network Monitoring](src/browser/docs/useOnline.md)** - Real-time online/offline status and connection quality
- **[User Activity](src/browser/docs/useIdle.md)** - Track user inactivity for security and performance optimization
- **[Media Queries](src/browser/docs/useMediaQuery.md)** - Listen to CSS media queries in JavaScript for responsive logic
- **[Network Speed](src/browser/docs/useNetworkSpeed.md)** - Adapt content quality based on connection speed
- **[Battery Status](src/browser/docs/useBattery.md)** - Optimize features based on device battery level
- **[Geolocation](src/browser/docs/useGeolocation.md)** - Access user location with proper permission handling

For detailed documentation on each hook, visit the [documentation folder](src/browser/docs) or check the individual hook files linked above.

---

## 🎨 Live Demo

An interactive demo showcasing all hooks is available in the `next-example` folder. See React Hooks Core in action with real-time updates and visual indicators.

Run locally: `npm run build && npm link && cd next-example && npm link react-hooks-core && npm run dev`

---

## 🌟 Why Choose React Hooks Core for Production?

### Problem: Reinventing the Wheel

Every React project needs device detection, online status monitoring, responsive design logic, and user activity tracking. Developers waste countless hours implementing these features from scratch, often with bugs, edge cases, and compatibility issues.

### Solution: Production-Ready Hooks

React Hooks Core provides battle-tested hooks that:
- ✅ Work out of the box with React 18+ and Next.js 13+
- ✅ Handle SSR/CSR seamlessly without configuration
- ✅ Include proper TypeScript types with full inference
- ✅ Cover edge cases you might miss
- ✅ Are fully tested with 92+ test cases
- ✅ Follow React best practices and patterns
- ✅ Have zero dependencies
- ✅ Are optimized for performance

### Impact on Your Development

- ⚡ **Faster Development** - Stop rewriting the same logic, ship features faster
- 🐛 **Fewer Bugs** - Tested hooks mean fewer edge cases and production issues
- 📦 **Smaller Bundle** - Tree-shakeable and zero dependencies keep bundles minimal
- 🎯 **Better UX** - Respect user preferences and device capabilities automatically
- 🔒 **More Secure** - Built-in security features like idle detection for auto-logout
- 💰 **Cost Effective** - Reduce development time and maintenance overhead

---

## 🗺️ Roadmap

We're actively expanding React Hooks Core with more production-ready hooks across multiple categories:

### 🔜 Coming Soon

- **Timer & Interval Hooks** - `useInterval`, `useTimeout`, `useCountdown`, `useDebounce`, `useThrottle`
- **UI & DOM Hooks** - `useClickOutside`, `useElementSize`, `useWindowSize`, `useScrollPosition`, `useHover`
- **Storage Hooks** - `useStorage`
- **Context & Providers** - Global state management and configuration providers

### 🎯 Our Commitment

- ✅ **Production-ready only** - Every hook is battle-tested before release
- ✅ **SSR-first** - Works with Next.js out of the box
- ✅ **100% test coverage** - Critical hooks are fully tested
- ✅ **TypeScript-native** - Proper types, not afterthoughts
- ✅ **Zero breaking changes** - Semantic versioning strictly followed

---

## 🛠️ Development & Testing

### Local Development

Use `npm link` to test the package in your projects before publishing. Build the package, link it globally, then link it in your project for instant testing.

### Testing Suite

Comprehensive test coverage with 92+ test cases covering initialization, SSR compatibility, state updates, error handling, cleanup, options, edge cases, and TypeScript types.

### Build System

Fast builds with `tsup` supporting both CommonJS and ES modules, TypeScript declarations, source maps, and tree-shaking optimization.

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new hooks, documentation improvements, or feature suggestions, your input helps make React Hooks Core better for everyone.

Please see our [Contributing Guide](CONTRIBUTING.md) for guidelines on code style, testing requirements, and the pull request process.

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

Copyright (c) 2025 React Hooks Core

---

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/react-hooks-core)
- [GitHub Repository](https://github.com/NightDevilPT/react-hooks-core)
- [Issue Tracker](https://github.com/NightDevilPT/react-hooks-core/issues)
- [Changelog](CHANGELOG.md)

---

## 💬 Support

- 🐛 [Report a bug](https://github.com/NightDevilPT/react-hooks-core/issues/new?template=bug_report.md)
- ✨ [Request a feature](https://github.com/NightDevilPT/react-hooks-core/issues/new?template=feature_request.md)
- 💡 [Ask a question](https://github.com/NightDevilPT/react-hooks-core/discussions)

---

<div align="center">
  <p>Made with ❤️ by developers, for developers</p>
  <p>
    <a href="https://github.com/NightDevilPT/react-hooks-core">⭐ Star us on GitHub</a>
  </p>
</div>
