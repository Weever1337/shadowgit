# 🌙 ShadowGit

**ShadowGit** is a lightweight Telegram bot that delivers real-time GitHub notifications directly to your Telegram chat. Stay updated with commits, issues, pull requests, and more without leaving your messaging app.

## 🚀 Features

- 📬 Instant GitHub notifications in Telegram
- 🔧 Easy setup with minimal configuration
- 💬 Supports multiple repositories
- 🛡️ Secure and privacy-focused

## 🛠️ Installation

<details>
<summary><strong>🐳 Docker Installation</strong></summary>

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Weever1337/shadowgit.git
   cd shadowgit
   ```

2. **Create a `.env` file:**

   Create a `.env` file in the root directory and add your Telegram bot token and other necessary configurations.

3. **Build and run the Docker container:**

   ```bash
   docker-compose build
   docker-compose up -d
   ```

</details>

<details>
<summary><strong>🛠️ Manual Installation</strong></summary>

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Weever1337/shadowgit.git
   cd shadowgit
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create a `.env` file:**

   Create a `.env` file in the root directory and add your Telegram bot token and other necessary configurations.

4. **Run the bot:**

   ```bash
   npm start
   ```

</details>

## ⚙️ How It Works

ShadowGit listens for events from GitHub repositories and forwards them to your specified Telegram chat. By setting up webhooks on your GitHub repositories, you can receive notifications for:

- 📝 New commits
- 🐛 Opened issues
- 📂 Pull requests
- ⭐ Stars and forks

The bot parses the incoming webhook data and formats it into readable messages, keeping you informed in real-time.

## 🔗 Useful Links

- 🤖 [Try the Bot](https://t.me/shadowgitbot)
- 👨‍💻 [Developer Contact](https://t.me/weever)

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
