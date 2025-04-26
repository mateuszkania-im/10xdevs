# VibeTravels

AI-powered travel planning application that transforms your travel notes into detailed trip itineraries.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

VibeTravels is a mobile and web application designed to simplify the process of planning engaging and interesting trips. Using artificial intelligence capabilities, the application allows users to transform simple notes about places and travel destinations into detailed travel plans.

### Key Features

- Create and manage travel projects
- Save and organize notes within projects
- Generate detailed travel plans based on user notes with AI
- Create alternative versions of travel plans
- Export plans to PDF format

The application is designed as a Minimum Viable Product (MVP) that focuses on key functionalities enabling users to effectively plan trips using AI.

## Tech Stack

### Frontend

- **Astro 5**: For building fast, efficient pages and applications with minimal JavaScript
- **React 19**: For interactive components where needed
- **TypeScript 5**: For static typing and better IDE support
- **Tailwind 4**: For convenient application styling
- **Shadcn/ui**: Library of accessible React components for UI
- **AcertenityUI**: Library of interactive components enhancing the application

### Backend

- **Supabase**: Comprehensive backend solution providing:
  - PostgreSQL database
  - SDK in multiple languages, serving as Backend-as-a-Service
  - Built-in user authentication
  - Open-source solution that can be hosted locally or on your own server

### AI Integration

- **Openrouter.ai**: Communication with AI models providing:
  - Access to a wide range of models (OpenAI, Anthropic, Google, etc.)
  - Financial limit settings for API keys

### CI/CD and Hosting

- **Github Actions**: For CI/CD pipeline creation
- **DigitalOcean**: For application hosting via docker image

## Getting Started Locally

### Prerequisites

- Node.js (v22.14.0) - we recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions
- Git

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/vibetravels.git
   cd vibetravels
   ```

2. Install the correct Node.js version using nvm

   ```
   nvm use
   ```

3. Install dependencies

   ```
   npm install
   ```

4. Configure environment variables
   Create a `.env` file in the project root with necessary Supabase and OpenRouter credentials:

   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

5. Start the development server

   ```
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the project for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Run Astro CLI commands
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## Project Scope

### In MVP Scope

- User account system (Supabase Auth)
- Creating and managing travel projects
- Creating, editing, and organizing notes
- Mandatory configuration note for each project
- Generating travel plans using AI (OpenRouter)
- Generating alternative plan versions
- Exporting plans to PDF
- Responsive user interface

### Out of MVP Scope

- Sharing plans between users
- Multimedia management (place photos)
- Advanced logistics planning
- Extensive user onboarding
- Interface personalization
- Rich multimedia handling and analysis
- Advanced time planning and logistics

## Project Status

This project is currently in the MVP development phase.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
