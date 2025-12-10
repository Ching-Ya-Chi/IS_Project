# IS_Project
The project for IS class
# Tea Garden Focus - Gamified Productivity App

## 📖 Overview

**Tea Garden Focus** is an interactive single-page application (SPA) designed to gamify the productivity experience. By combining the Pomodoro technique with a tea-growing simulation, the app encourages users to maintain focus on their tasks.

As users complete focus sessions, they cultivate different varieties of tea based on the duration and location of their session. These rewards can be used to unlock achievements, collect rare tea types, and customize their personal avatar, "Tea Mi."

## ✨ Key Features

*   **Focus Timer**: Customizable timer sessions featuring dynamic video backgrounds that change phases as time progresses.
*   **Map Exploration**: Select different tea gardens (Locations A, B, C, D) to cultivate specific types of tea based on local conditions.
*   **Tea Cabinet**: A comprehensive collection system to track harvested teas, categorized by fermentation level (Green, Yellow, Oolong, Red, White, Black).
*   **Gamification**:
    *   **Achievements**: Unlock badges based on accumulated focus time and collection milestones.
    *   **Character Customization**: A dressing room feature to customize the "Tea Mi" avatar with unlocked costumes and accessories.
*   **Dynamic Interactions**: Character dialogue and animated feedback based on user progress and global state management.
*   **VIP Subscription**: A simulated subscription interface unlocking exclusive features and unlimited storage.

## 🛠️ Technology Stack

*   **Frontend**: HTML5, CSS3, JavaScript (ES6+).
*   **Architecture**: Custom Vanilla JS Single Page Application (SPA) routing without external frameworks.
*   **Assets**: Custom digital art and MP4 video assets.

## 📂 Project Structure

```text
/project-root
  ├── index.html          # Main entry point (Shell container)
  ├── script.js           # Core logic, state management, and SPA routing
  ├── style.css           # Global variables and component styling
  ├── img/                # Image assets (Tea icons, Avatars, Costumes)
  └── pages/              # HTML fragments for dynamic content loading
       ├── firstpage.html
       ├── login.html
       ├── main.html
       ├── map.html
       ├── focus.html
       ├── focus_result.html
       ├── tea_cabinet.html
       ├── costume.html
       ├── costume_achievement.html
       ├── achievements.html
       ├── subscribe.html
       └── ...
```
## 👥 Team Roles & Contributions

This project was brought to life through the collaborative efforts of the following team members:

### **ChengYouLin**
**Role: Project Management & Documentation**
*   Responsible for establishing project documentation and architectural guidelines.
*   Defined development steps and milestones to ensure project timeline adherence.
*   Conducted rigorous code reviews to ensure code quality, consistency, and maintainability.

### **CHU, YUNG-EN**
**Role: Visual Arts & Animation**
*   Lead artist responsible for creating all original visual assets, including tea illustrations, map backgrounds, and UI icons.
*   Designed and produced animations for the "Tea Mi" character and focus states to enhance user engagement.

### **yhc28** **and two contributers**
**Role: UI/UX Design**
*   Designed the user interface layout and visual hierarchy.
*   Handled CSS styling and aesthetic refinement to ensure a cohesive, visually appealing, and user-friendly experience across the application.

### **Ching-Ya-Chi**
**Role: Core Development**
*   Primary software engineer responsible for the implementation of the codebase.
*   Developed the JavaScript logic, constructed the SPA routing system, and integrated the frontend design with the application's functional requirements.

## 🚀 Getting Started

1.  **Clone the repository** to your local machine.
2.  **Verify Structure**: Ensure the directory structure matches the `Project Structure` outlined above.
3.  **Run**: Open `index.html` in any modern web browser (Chrome, Firefox, Edge).
4.  **Note**: Since this application uses `fetch` for dynamic HTML loading, if you encounter CORS issues locally, please run it via a local server (e.g., Live Server in VS Code).

---
*© 2025 Tea Garden Focus Team. All Rights Reserved.*
