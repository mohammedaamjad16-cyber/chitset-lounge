# ChitSet Lounge

# ChitSet - Prompt 1



## Foundation, User Experience, Application Architecture & Pre-Game System



You are an expert Product Designer, UI/UX Designer, Senior Frontend Engineer, Software Architect, React + TypeScript Developer, and Multiplayer Game Interface Designer.



Your objective is to build a production-quality web application named **ChitSet**.



This is not a prototype, hackathon demo, or landing page. The application should be built with the mindset that it will eventually be deployed publicly and support thousands of concurrent users.



The application must be modular, scalable, reusable, maintainable, responsive, accessible, and easy to extend in future milestones.



Every component, layout, animation, page, and state should be designed so that future gameplay can be added without redesigning the existing UI.



Never remove features unless explicitly instructed.



Never rewrite architecture.



Always extend the existing project.



Avoid duplicate code.



Build reusable components whenever possible.



Follow modern frontend best practices.



------------------------------------------------------------



# PROJECT OVERVIEW



ChitSet is a real-time multiplayer browser game inspired by the traditional Indian "4 Chit Game."



Players create private rooms, invite friends, wait in a shared lobby, and eventually play together online.



The first milestone does NOT include gameplay.



This milestone only builds the complete application foundation.



The result should feel like a polished indie multiplayer game rather than a generic dashboard or college project.



------------------------------------------------------------



# TARGET AUDIENCE



The application should be enjoyable for:



• College students



• Friends



• Families



• Casual gamers



• Mobile users



• Desktop users



The UI should be simple enough for new players while still feeling premium.



------------------------------------------------------------



# DESIGN PHILOSOPHY



The experience should feel:



Modern



Premium



Minimal



Elegant



Friendly



Interactive



Fast



Comfortable



Responsive



Immersive



Every page should feel alive through subtle motion.



Never overwhelm the user.



Maintain generous spacing.



Avoid visual clutter.



Use consistent alignment.



Maintain strong visual hierarchy.



------------------------------------------------------------



# VISUAL STYLE



The overall experience should combine:



Modern multiplayer games



Glassmorphism



Soft gradients



Premium shadows



Rounded corners



Paper-inspired visual elements



Gaming-inspired interface



Subtle tabletop atmosphere



Instead of looking like a business dashboard, the application should remind players that they are entering a multiplayer game room.



The visual identity should be memorable.



------------------------------------------------------------



# TECHNOLOGY STACK



Use:



React



TypeScript



Vite



TailwindCSS



shadcn/ui



Framer Motion



React Router



Lucide Icons



Organize the project for long-term scalability.



------------------------------------------------------------



# PROJECT STRUCTURE



Organize the application using a clean folder structure.



Suggested structure:



src/



    assets/



    animations/



    components/



        ui/



        shared/



        forms/



        navigation/



        layout/



        lobby/



        room/



    contexts/



    hooks/



    layouts/



    pages/



    routes/



    services/



    store/



    styles/



    types/



    utils/



    constants/



Avoid putting unrelated files into the same folder.



Use descriptive names.



------------------------------------------------------------



# COLOR SYSTEM



Primary



#4F46E5



Secondary



#7C3AED



Accent



#22C55E



Danger



#EF4444



Warning



#F59E0B



Information



#0EA5E9



Dark Background



#0F172A



Dark Card



#1E293B



Light Background



#F8FAFC



Light Card



#FFFFFF



Keep contrast high.



Support both Dark and Light themes.



------------------------------------------------------------



# TYPOGRAPHY



Use clean modern fonts.



Headings should be bold and highly readable.



Body text should prioritize readability.



Buttons should use semi-bold text.



Spacing between typography elements should remain consistent throughout the application.



------------------------------------------------------------



# DESIGN SYSTEM



Create reusable UI components.



Primary Button



Secondary Button



Outlined Button



Danger Button



Icon Button



Text Input



Password Input



Search Input



Dropdown



Checkbox



Radio Button



Toggle Switch



Badge



Avatar



Card



Glass Card



Modal



Dialog



Tooltip



Toast



Loading Spinner



Skeleton Loader



Divider



Tabs



Accordion



Empty State



Error Card



Page Header



Section Title



All components should follow the same visual language.



------------------------------------------------------------



# THEME SYSTEM



Implement:



Dark Theme



Light Theme



System Theme



Theme preference should be saved locally.



Switching themes should animate smoothly.



Icons should adapt automatically.



------------------------------------------------------------



# APPLICATION LAYOUT



Every page should share a consistent layout.



Navigation



↓



Main Content



↓



Footer



Content should remain centered.



Maximum width should remain consistent.



Spacing should remain consistent.



------------------------------------------------------------



# NAVIGATION BAR



Create a premium navigation bar.



Left Side:



ChitSet Logo



ChitSet Text



Center:



Home



About



Right Side:



Create Room



Join Room



Theme Toggle



Mobile Menu



Navigation should remain sticky.



When scrolling:



Background should blur slightly.



Navigation should gain a subtle shadow.



Transition should be smooth.



------------------------------------------------------------



# LOGO



Create a placeholder logo.



The logo should represent four folded paper chits arranged together.



Minimal.



Flat.



Modern.



Easy to recognize.



Works in dark and light themes.



------------------------------------------------------------



# LANDING PAGE



The landing page is the first thing users experience.



It should instantly communicate:



This is a multiplayer game.



This game is simple.



This game is social.



This game is fun.



Structure:



Hero Section



↓



Features



↓



How It Works



↓



Why ChitSet



↓



Frequently Asked Questions



↓



Call To Action



↓



Footer



------------------------------------------------------------



# HERO SECTION



Display a large headline.



Example:



Pass Smart.



Collect Four.



Win Together.



Display a short description explaining the game.



Keep it under three lines.



Primary Button



Create Room



Secondary Button



Join Room



Buttons should animate slightly when hovered.



The hero illustration should depict a modern tabletop with folded paper chits and friends gathered around, using a clean vector style rather than realistic artwork.



Background decorations should be subtle and never distract from the content.



------------------------------------------------------------



# FEATURES SECTION



Display six feature cards in a responsive grid.



Recommended features:



Real-Time Multiplayer



Private Rooms



Quick Matches



Strategy Based



Easy To Learn



Cross Device Support



Each card should contain:



Icon



Title



Short Description



Cards should slightly lift on hover.



Animations should remain subtle.



------------------------------------------------------------



# HOW IT WORKS



Explain the complete flow in three simple steps.



Step 1



Create or Join a Room.



Step 2



Wait for your friends in the lobby.



Step 3



Play together and collect four matching chits.



Display these steps in a responsive timeline with smooth entrance animations.



------------------------------------------------------------



# WHY CHITSET



Instead of paragraphs, use information cards.



Cards may include:



No Downloads



Play Anywhere



Invite Friends



Private Matches



Simple Rules



Competitive Fun



Arrange the cards in a balanced responsive layout.



------------------------------------------------------------



# FREQUENTLY ASKED QUESTIONS



Create an accordion component.



Only one question should remain open at a time.



Example questions:



What is ChitSet?



Is it free?



Can I play on mobile?



Do I need an account?



How many players can join?



Answers should remain short and friendly.



------------------------------------------------------------



# CALL TO ACTION



Display a full-width section encouraging users to begin.



Include two large buttons:



Create Room



Join Room



Background should use a subtle gradient.



Use generous spacing.



------------------------------------------------------------



# CREATE ROOM PAGE



This page allows a host to prepare a new match.



The page should feel clean and welcoming.



Display the form inside a premium glass card.



Fields:



Host Name



Room Name



Maximum Players



Category



Visibility



Game Mode



Classic should be selected by default.



Future modes should appear disabled with a "Coming Soon" badge instead of being hidden.



Validation should occur instantly as users type.



Display helpful error messages below each field.



Never use browser alert dialogs.



...

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1e7ad3db-10ad-4abb-8435-ca1e364c156d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
