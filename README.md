# 🧙‍♂️ NgOracle

> AI-powered Angular documentation assistant with semantic search and intelligent answers

**NgOracle** is an open-source tool that helps Angular developers get instant answers from Angular documentation using AI-powered semantic search. Ask questions, paste errors, or get code reviews with context from multiple Angular versions.

## ✨ Features

- 🤖 **AI-Powered Answers** - Get instant, contextual answers from Angular documentation
- 📚 **Multi-Version Support** - Query docs for Angular 18, 19, 20, and 21
- 💬 **Three Modes**:
  - **Ask Questions** - Learn Angular concepts quickly
  - **Paste Errors** - Understand and fix error messages
  - **Code Review** - Get feedback with best practices

## 🏗️ Tech Stack

- **Frontend**: Angular 20 (standalone components, signals, zoneless)
- **Backend**: Firebase (Genkit, Firestore, Cloud Functions)
- **AI**: Google Gemini 2.5 Flash with built-in embeddings
- **UI**: Angular Material 3 with custom theme
- **Build**: Nx monorepo with SSR support
- **Styling**: SCSS with Material You design tokens

## 🚀 Getting Started

```bash
# Clone and install
git clone https://github.com/mainawycliffe/ng-lens.git
cd ng-lens
pnpm install

# Run dev server
pnpm nx serve ui

# Build for production
pnpm nx build ui
```

## 🤝 Contributing

Contributions are welcome! **PRs are open and suggestions are highly appreciated.** Please:

1. Fork the repo and create a feature branch
2. Follow Angular best practices (standalone components, signals, OnPush)
3. Use [Conventional Commits](https://www.conventionalcommits.org/)
4. Test your changes: `pnpm nx test ui && pnpm nx lint ui`
5. Submit a PR

## 🛣️ Roadmap

- [x] Backend integration (Firebase Genkit + Firestore)
- [x] Vector search implementation
- [x] Angular docs crawler
- [x] Dark mode
- [ ] CLI tool
- [ ] VS Code extension

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Maina Wycliffe**

- Website: [mainawycliffe.dev](https://mainawycliffe.dev)
- GitHub: [@mainawycliffe](https://github.com/mainawycliffe)
- Twitter: [@mainawycliffe](https://twitter.com/mainawycliffe)

## ⭐ Show Your Support

Give a ⭐ if this project helped you!

<a href="https://github.com/sponsors/mainawycliffe" target="_blank">
  <img src="https://img.shields.io/badge/Sponsor-Maina%20Wycliffe-pink?style=for-the-badge&logo=github-sponsors" alt="Sponsor Maina Wycliffe" />
</a>

---

<p align="center">
  Made with ❤️ by <a href="https://mainawycliffe.dev">Maina Wycliffe</a>
</p>
