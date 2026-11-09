# IPHS School Library

Developed by Dixars.

Open **index.html** in any modern browser, on a computer or a phone. No server, Node.js or install is needed.

`index.html` is a single self-contained file (styles, code, books and pictures are inside it), so it still works if you copy just that one file, or open it from a phone's Downloads or file manager.

## Files (all in one folder)
| File | What it is |
|---|---|
| `index.html` | The app. Open this file. |
| `index.src.html`, `styles.css`, `app.js` | Editable source for the design and behaviour |
| `build_single.py` | Rebuilds the one-file `index.html` after you edit the source files |
| `guide.js` | Teaching hints and study tips for the class guide |
| `manifest.webmanifest`, `sw.js`, `icon-*.png`, `apple-touch-icon.png` | Home-screen install and offline support |
| `build_dictionary.py` | Optional: builds a full offline dictionary pack (see below) |
| `data.js` | Books, units and quiz questions (generated from `library.db`) |
| `logo.png`, `front.jpg`, `library.jpg`, `texture.jpg` | Artwork prepared from your supplied images |
| `library.db` | Your original database, unchanged. It is the source for `data.js` |
| `build_data.py` | Rebuilds `data.js` after you change `library.db` |

## Features
- Library shelf for Standard 1-8 and Form 1-4, with a spine for each subject
- Book reader with unit navigation, a progress bar and a saved reading position
- Bookmarks, favourites and mark-as-read
- Subject quizzes with instant feedback and saved scores
- Progress page: completion, achievements, quiz history and saved books
- Ask Library AI: offline answers from the books, or an optional online AI service (the API key is kept for the current visit only)
- Light and dark theme, local profile with a library card
- Works on phones, tablets and desktops

## Where your data is saved
Your profile, reading position, bookmarks, favourites and scores are stored in this browser (localStorage) on this device. Use the same browser each time. Some phones open files in a way that blocks browser storage; if Settings shows a warning, your progress lasts only until you close the page. Clearing site data, or using a private window, removes them.

## Adding books or quizzes
1. Add rows to the `books`, `units` or `trivia` tables in `library.db`.
2. Run `python build_data.py`, then `python build_single.py`.
3. Reload `index.html`.

Note: the fonts (Bitter and Atkinson Hyperlegible) load from Google Fonts when you are online. Offline, the app uses Georgia and your system font instead.

## Installing on the home screen (PWA)
The app includes `manifest.webmanifest`, `sw.js` (offline support) and icons, so it can be installed like a normal app.
Browsers only allow installing from a secure web address (https), not from a file on the phone. To enable it:
1. Upload the whole folder to a free static host (GitHub Pages, Netlify Drop or Cloudflare Pages).
2. Open the link in Chrome on the phone and choose **Install app** (or the Install button in Settings).
3. On iPhone use Safari: Share, then Add to Home Screen.
After the first visit the app opens and works with no internet. Keep `index.html`, `manifest.webmanifest`, `sw.js` and the four icon files together.

## Class guide
Each class page lists its subjects in groups with a hint on every subject, then a class guide with a Teaching hints view and a Study tips view. The wording lives in `guide.js`. Edit it, then run `python build_single.py`.

## Dictionary
Searching any word shows its dictionary entry above the matching books, with every meaning grouped by part of speech, examples, similar words and a Listen button. Double-tap any word while reading a book to see its meaning without leaving the page.

- **Online:** meanings come from the free Free Dictionary API (Wiktionary). Each word you look up is saved on this device, so it works offline the next time.
- **Fully offline (optional):** on a computer with Python and internet, run `pip install nltk` then `python build_dictionary.py`. This creates `dict-*.js` files (about 20 MB, ~150,000 words from Princeton WordNet) next to `index.html`. Keep them in the same folder (upload them too if you host the app). The pack does not work when a phone opens the single `index.html` from Downloads.

## Read aloud
Open any book and tap **Listen**. The app reads the book aloud using the voices already installed on the device, so it needs no internet when an offline English voice is available. The paragraph being read is highlighted and the page scrolls along. Use the player to pause or resume, jump to the previous or next paragraph, change the speed, or pick a voice. While the player is open you can also tap any paragraph to start reading from it. Your speed and voice are remembered.

Voices differ by device. If you hear no sound or only a poor voice, open the phone's Settings, Text-to-speech output, and install or update an English voice (for example Google or Samsung). Books are read in English; Chichewa has no voice on most devices.

## Teacher results
Teachers (profile role "Teacher") get a **Results** tab and a panel on Home.
- **Menus**: the menu button (top left) opens a drawer with every page and your classes. Inside a class, the bar under the breadcrumbs jumps between Overview, Learners, Positions, Focus and Report, and switches class.
- **Enrolment**: enrol one learner (name, gender, admission number, guardian phone) or many at once by pasting lines such as `Name, Girl, 1021` or loading a CSV or text file. Duplicate names and admission numbers are refused. Edit or remove learners, search the list, download the class list.
- **Positions**: learners are ranked automatically from the highest average to the lowest. Arrange by highest, lowest, name, or grouped by grade (A to F). Filter by term or subject to rank on that alone.
- **Focus**: class-wide and per-learner things to focus on: weak subjects, topics to revisit, learners needing support or close to passing, falling marks, attendance, missing marks and boys/girls gap.
- **PDF export**: Download PDF makes a landscape report with summary, grade chart, class focus, positions, subject performance, every learner's marks and focus notes for each learner. Report cards makes one page per learner (a single card is available from the Positions table). PDFs are built in the browser and work offline.
- **Assessments**: create a test, quiz, assignment or exam with subject, term, date and total marks.
- **Entering marks**: type a mark and press Enter to move down the list, or paste a column from a spreadsheet. Marks outside 0 to the total are rejected. Tick Absent for learners who missed it. Everything saves as you type, and a summary shows average, highest, lowest, pass count and a grade chart.
- **Report**: learners by assessment, with average, grade, position (ties share a position) and class average and pass rate. Filter by term or subject, download CSV (opens in Excel), or print.
- **Grades**: A 80+, B 70+, C 60+, D 50+, E 40+, F below 40. Pass mark 50% (`BANDS` and `PASS_MARK` in app.js).
- **Backup**: results live only in this browser. Use Results, Download backup, and Restore to move them to another device.

## Books included
Standard 5 to 8 notes, study guides, past examination papers and the Standard 8 Mathematics model questions and answers are stored in `library.db` (45 books added to the first sample). Diagrams and pictures inside the original files were not copied, only the text. To add more books later, insert them into the `books` table and run `python build_data.py`, then `python build_single.py`.

## About, support, licence and privacy
Pages at `#/about`, `#/support`, `#/license` and `#/privacy`, linked from the menu drawer, Settings and the footer. Support opens the user's email app with a prepared message to dixarstech@gmail.com (no server needed). Change the address with `SUPPORT_EMAIL` in app.js.

## Put it on GitHub Pages and install it from the link
1. Create a GitHub repository and upload everything in this folder to the repository root (index.html, manifest.webmanifest, sw.js, the icon-*.png files, apple-touch-icon.png and `.nojekyll`).
2. Repository Settings, Pages, choose "Deploy from a branch", branch `main`, folder `/ (root)`, Save.
3. After a minute the app is at `https://YOUR-NAME.github.io/REPOSITORY/`. Open that link on the phone.
4. On Android Chrome a gold **Install** bar appears under the top bar. Tap Install to add the app to the home screen and app menu. On iPhone, open the link in Safari, tap Share, then Add to Home Screen.
5. To publish an update, upload the new files. Raise the version in `sw.js` (`iphs-library-v3`, then v4 and so on) so phones refresh their saved copy.
Installing needs https, which GitHub Pages provides. Opening the file directly from the phone's storage cannot be installed.

## Gemini AI for teachers
Teachers (role Teacher) can switch Ask Library AI to Online and use Google Gemini, either through the school proxy (`gemini-proxy.js`, a Cloudflare Worker that keeps the key secret, see `PROXY_SETUP.md`) or with their own key. Students always get offline answers from the books.


## Online accounts (optional)
See **SUPABASE_SETUP.md**. Users can sign in from Menu → Sign in to keep progress and results online, and approved teachers get Gemini.
