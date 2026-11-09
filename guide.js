/* Class guide content: general teaching hints and study tips.
   This is practical guidance, not the official syllabus. Edit the text freely, then run
   `python build_single.py` to rebuild index.html. Each hint is {t: title, d: description}. */
window.IPHS_GUIDE = {
  bands: {
    lower: {
      name: "Lower primary",
      stages: "Standard 1 to 4",
      about: "Learners are building the basics of reading, writing and number. They learn best through talking, singing, handling real things and short, varied activities.",
      learners: [
        "Can focus on one activity for about 10 to 15 minutes.",
        "Learn by doing: counting stones, sorting leaves, acting out a story.",
        "Reading and writing skill differs a lot between children in the same class.",
        "Need clear, simple instructions and plenty of encouragement.",
        "Understand best what they can see, touch and link to home life."
      ],
      teach: [
        { t: "Keep activities short", d: "Change the activity every 10 to 15 minutes: talk, move, draw, write." },
        { t: "Use real objects", d: "Bottle tops for counting, leaves for science, local stories for language." },
        { t: "Repeat in different ways", d: "Say it, sing it, draw it, act it. Repetition builds memory." },
        { t: "Read aloud every day", d: "Short stories read aloud build vocabulary before children read alone." },
        { t: "Group by need", d: "Pair confident readers with learners still finding their feet." },
        { t: "One instruction at a time", d: "Show what to do, then let learners do it before adding the next step." }
      ],
      learn: [
        { t: "Read aloud", d: "Read to someone at home, even for five minutes a day." },
        { t: "Practise a little each day", d: "Write letters and numbers a few times every day." },
        { t: "Ask questions", d: "If you do not understand, ask. Every question is a good question." },
        { t: "Draw what you learn", d: "Pictures help you remember words and ideas." }
      ]
    },
    upper: {
      name: "Upper primary",
      stages: "Standard 5 to 8",
      about: "Learners can now follow longer explanations and think about why and how. Subjects become more separate, and Standard 8 learners prepare for end-of-primary examinations.",
      learners: [
        "Can think about causes and reasons, not only facts.",
        "Friends matter. Group work is motivating when roles are clear.",
        "Reading fluency still varies, so some learners need extra support.",
        "Start to feel examination pressure as Standard 8 approaches.",
        "Enjoy responsibility, such as leading a group or explaining to others."
      ],
      teach: [
        { t: "Link to real life", d: "Start each topic with something learners see at home or in the community." },
        { t: "Use group work", d: "Give each learner a role: reader, writer, reporter, timekeeper." },
        { t: "Ask why and how", d: "Follow every answer with 'How do you know?' to build reasoning." },
        { t: "Teach note-making", d: "Show learners how to turn a unit into headings and key points." },
        { t: "Revise with quizzes", d: "Short quizzes at the start of a lesson bring back last week's learning." },
        { t: "Support slower readers", d: "Read key paragraphs aloud and let pairs read together." }
      ],
      learn: [
        { t: "Plan study time", d: "Choose a short time each day and keep to it." },
        { t: "Write notes in your own words", d: "After each lesson, write three key points without copying." },
        { t: "Test yourself", d: "Use the review questions and quizzes, then check your answers." },
        { t: "Study with a friend", d: "Take turns explaining a topic to each other." }
      ]
    },
    junior: {
      name: "Junior secondary",
      stages: "Form 1 and 2",
      about: "Learners meet more subjects, more teachers and more reading. Many need help moving from primary habits to independent study. Foundations built here carry into Form 3 and 4.",
      learners: [
        "Adjusting to new subjects, teachers and a heavier workload.",
        "Can handle abstract ideas when they start from concrete examples.",
        "Growing independence. Some hide confusion rather than ask.",
        "Wide differences in English and number skills from different primary schools.",
        "Sensitive to how they are seen by classmates."
      ],
      teach: [
        { t: "Check the basics", d: "Spend the first weeks finding gaps in reading, English and number work." },
        { t: "Concrete before abstract", d: "Use an example or demonstration first, then state the rule." },
        { t: "Welcome questions", d: "Let learners ask privately or in writing if they are shy." },
        { t: "Set short practical tasks", d: "Experiments, surveys and projects keep learners active." },
        { t: "Teach study skills", d: "Show how to use headings, summaries and review questions." },
        { t: "Watch for quiet strugglers", d: "Check the exercise books of learners who never speak up." }
      ],
      learn: [
        { t: "Make a timetable", d: "Plan time for homework and revision across all subjects." },
        { t: "Turn headings into questions", d: "Then answer them from memory and check the book." },
        { t: "Use the review questions", d: "Do the questions at the end of each unit before moving on." },
        { t: "Ask early", d: "If a topic confuses you, ask your teacher before it grows." }
      ]
    },
    senior: {
      name: "Senior secondary",
      stages: "Form 3 and 4",
      about: "Learners focus on examination subjects and think about life after school. Teaching shifts toward depth, practice and exam technique, while keeping understanding at the centre.",
      learners: [
        "Preparing for national examinations, which brings pressure.",
        "Can work independently when given clear goals.",
        "Thinking about careers, further study and work.",
        "Need regular practice with questions, not only explanations.",
        "Benefit from knowing exactly what examiners look for."
      ],
      teach: [
        { t: "Plan backward from the exam", d: "List every topic, then schedule teaching and revision." },
        { t: "Use past questions", d: "Practise a few each week and discuss marking points as a class." },
        { t: "Teach answering technique", d: "Show how to read the question, plan, and answer in the marks given." },
        { t: "Encourage independent reading", d: "Set reading before class so lesson time goes to discussion." },
        { t: "Build revision routines", d: "Summary sheets, flash cards and peer teaching in small groups." },
        { t: "Connect to careers", d: "Show where each subject leads. It keeps learners motivated." }
      ],
      learn: [
        { t: "Revise early", d: "Cover a little of every subject each week instead of cramming." },
        { t: "Practise past questions", d: "Work under time limits, then compare with marking points." },
        { t: "Make summary sheets", d: "One page per topic: key points, formulas, definitions." },
        { t: "Look after yourself", d: "Sleep, meals and breaks help you remember more." }
      ]
    }
  },

  routine: {
    teach: {
      title: "A simple lesson shape",
      note: "Times suit a 40 minute period. Shorten or lengthen each part to fit.",
      steps: [
        { t: "Recall", m: "5 min", d: "Ask two or three questions about the last lesson, or run the subject quiz." },
        { t: "Introduce", m: "10 min", d: "State the aim in one sentence, then explain with an example or object." },
        { t: "Practise together", m: "10 min", d: "Work one example as a class, then another in pairs." },
        { t: "Practise alone", m: "10 min", d: "Learners try on their own while you walk around and help." },
        { t: "Check and close", m: "5 min", d: "Each learner answers one question or sums up the lesson in a sentence." }
      ]
    },
    learn: {
      title: "A simple study routine",
      note: "About 30 minutes a day is enough when you do it every day.",
      steps: [
        { t: "Read", m: "10 min", d: "Read one unit or part of a unit slowly. Say hard words aloud." },
        { t: "Note", m: "5 min", d: "Close the book and write three key points in your own words." },
        { t: "Test", m: "10 min", d: "Answer the review questions or take the quiz. Check each answer." },
        { t: "Revisit", m: "5 min", d: "The next day, recall yesterday's key points before starting anything new." }
      ]
    }
  },

  library: {
    teach: [
      "Read a unit aloud and pause at each heading to ask what learners expect next.",
      "Use the Review Questions at the end of a unit for group discussion or homework.",
      "Start a lesson with the subject quiz and talk through the wrong answers.",
      "Let learners use Ask Library AI to check a definition against the book.",
      "Where devices are few, share one between a group: one reads, one scrolls, one writes notes."
    ],
    learn: [
      "Open a unit from the shelf and use the unit list to jump to the part you need.",
      "Bookmark a book you want to come back to and mark it as read when you finish.",
      "Try the Review Questions without looking, then check the book.",
      "Take the subject quiz to see what you remember.",
      "Ask Library AI when a word or idea is unclear."
    ]
  },

  subjects: {
    english: {
      teach: ["Speak and listen before reading and writing new words.", "Read a short passage aloud, then ask learners to retell it in their own words.", "When marking, praise one thing first, then correct one or two errors at a time."],
      learn: ["Read a little every day, even half a page.", "Keep a notebook of new words with one sentence for each.", "Write a few sentences about your day and ask someone to read them."]
    },
    chichewa: {
      teach: ["Use stories, proverbs and songs learners already know.", "Let learners speak first, then write what they said.", "Compare Chichewa and English words to help learners move between languages."],
      learn: ["Ask an elder for a story or proverb and write it down.", "Read aloud in Chichewa to practise spelling and sounds.", "Write short notes or letters to a friend."]
    },
    math: {
      teach: ["Move from real objects to pictures, then to numbers and symbols.", "Ask learners how they found an answer, not only what it is.", "Use everyday examples: market prices, distances, sharing food."],
      learn: ["Practise a little each day. Skills grow with repetition.", "Check an answer by working it backwards.", "When you are stuck, draw the problem."]
    },
    science: {
      teach: ["Let learners observe first. Ask 'What do you notice?' before explaining.", "Use safe, local materials for simple experiments.", "Link each topic to home life: water, soil, health, weather."],
      learn: ["Look closely at things around you and ask why they happen.", "Draw and label diagrams. They help you remember.", "Explain what you learned to someone at home."]
    },
    social: {
      teach: ["Use maps, local places and community examples.", "Ask learners to compare past and present, or their village with another place.", "Use discussion and role play so learners hear other points of view."],
      learn: ["Find places on a map as you read about them.", "Make a short timeline for events you study.", "Discuss a topic with a friend and listen to their view."]
    },
    life: {
      teach: ["Create a safe, respectful space where learners can ask honest questions.", "Use short real-life situations and ask 'What would you do?'", "Involve parents or community health workers where it helps."],
      learn: ["Think about how each lesson applies to your own life.", "Ask a teacher or trusted adult about anything unclear.", "Practise healthy habits such as handwashing every day."]
    },
    agri: {
      teach: ["Use a school garden or nearby farm for hands-on practice.", "Match lessons to the farming season in your area.", "Ask learners to record what they plant and what they observe."],
      learn: ["Try what you learn at home in a small garden or pot.", "Keep notes on planting dates and growth.", "Ask farmers in your community what they do and why."]
    },
    religion: {
      teach: ["Present every faith with respect and let learners speak about their own.", "Use stories, then ask what values they teach.", "Link lessons to daily behaviour: honesty, kindness, forgiveness."],
      learn: ["Listen to others with respect, even when beliefs differ.", "Pick one value from each lesson and practise it this week.", "Ask questions politely when you want to understand."]
    },
    arts: {
      teach: ["Give time to create. The process matters more than a perfect result.", "Use local materials, songs, dances and crafts.", "Let learners show and explain their work to the class."],
      learn: ["Practise a little every day: drawing, singing, making.", "Look at local crafts and songs for ideas.", "Share your work and listen to feedback."]
    },
    physics: {
      teach: ["Start from something learners can see, then introduce the formula.", "Work examples step by step and write the units every time.", "Use simple demonstrations with local materials when equipment is limited."],
      learn: ["Write the formula, the values and the units before calculating.", "Draw a diagram for every problem.", "Practise past questions after each topic."]
    },
    chem: {
      teach: ["Show reactions safely, or use everyday examples: rust, cooking, soap.", "Introduce symbols and equations a little at a time, with regular practice.", "Stress laboratory safety in every practical lesson."],
      learn: ["Learn symbols and common formulae a few at a time.", "Link each topic to something you see: cooking, rust, cleaning.", "Balance equations step by step and check both sides."]
    },
    bio: {
      teach: ["Use specimens, models and drawings: leaves, flowers, bones.", "Teach key terms with a meaning and an example.", "Connect topics to health and the environment in the community."],
      learn: ["Draw and label diagrams, then redraw them from memory.", "Keep a list of key terms with short meanings.", "Link each topic to your own body or surroundings."]
    },
    business: {
      teach: ["Use local examples: a market stall, a shop, a small farm business.", "Let learners keep simple records of income and spending.", "Role-play buying, selling and bookkeeping."],
      learn: ["Keep a simple record of money you receive and spend.", "Look at how a local shop or stall makes a profit.", "Practise bookkeeping layouts until they feel natural."]
    },
    cs: {
      teach: ["Teach ideas away from the machine too: step-by-step instructions, flowcharts.", "Share devices in small groups with set roles.", "Set short practical tasks and check they are finished."],
      learn: ["Practise typing and basic tasks whenever you can use a computer.", "Write the steps of a task on paper first.", "Teach a friend what you learned. It strengthens your own understanding."]
    }
  }
};
