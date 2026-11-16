# PathFinder: Graphs and Shortest Paths

An interactive educational web application developed for **COS 750: Educational Software Development** at the **University of Pretoria** (November 2026). PathFinder provides tutor-style, pre-lecture preparation on graph data structures and Dijkstra’s shortest-path algorithm for COS 212 students with zero prior knowledge.

---

## 👥 Group Information

**Team Name:** The Final Brain Cell

| Member Name | Student Number |
| :--- | :--- |
| Ann-Mari Oberholzer | u23537729 |
| Thomas Isebeck | u20446332 |
| Tracy-Lee Oberem | u20453362 |
| Ayaaz Street | u20427248 |
| Nikhil Govender | u22504193 |
| Talhah Karodia | u22509748 |
| Lunga Ndlovu | u22525697 |

---

## 📚 Documentation & Design Links

*   **Instructional Design (ID) Document:** [Link to ID Document PDF/Markdown](#)
*   **Software Engineering (SE) Document:** [Link to SE Document PDF/Markdown](#)
*   **Figma Design & Wireframes:** [Link to Figma Designs](https://www.figma.com/design/JuhNPSeExQGgTpgEYcJUHq/PathFinder-%E2%80%94-UI-Screens---Learning-Storyboard?node-id=11-2&t=3wzEgkyPi8HZS9Lk-1)

---

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript, Vite
*   **Styling & UI:** Tailwind CSS, Lucide Icons
*   **Architecture:** Component-driven modular design with JSON-based lesson content and isolated algorithm logic (`dijkstra.ts`).
*   **State & Persistence:** React `useState` and browser `localStorage` for offline progress tracking and user preferences.

---

## 🚀 Getting Started & Local Installation

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/thomasisebeck/COS750.git](https://github.com/thomasisebeck/COS750.git)
2. **Navigate to the project directory**
   ```bash
   cd COS750
   cd frontend
3. **Install dependencies**
   ```bash
   npm install
4. **Run the development server**
   ```bash
   npm run local-dev
5. **Open the app in your browser**
   This will be dependent on your localhost settings.

---

## 🌟 Key Features & Architecture

1. **7-Stage Learning Path:** Structured journey from basic everyday connections (Lesson 0) to graph vocabulary, weighted paths, step-by-step Dijkstra walkthroughs, guided practice, and final summative assessment (Lesson 6).
2. **Inclusive & Accessible UI:** Designed with high-contrast accessibility tokens and toggles for reduced motion, contrast, sound effects, and volume.
3. **Multi-Sensory Feedback:** Dynamic audio cues (piano notes on component interactions and audio feedback for notifications).
4. **Optional Narration:** Built-in `SpeechButton` component supporting server-side text-to-speech (`/api/tts`) with a seamless browser speech-synthesis fallback.

## 📄 License & Acknowledgments
Developed as part of the COS 750 curriculum requirements at the University of Pretoria, Department of Computer Science (2026).
