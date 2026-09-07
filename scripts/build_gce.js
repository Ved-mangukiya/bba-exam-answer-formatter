const fs = require('fs');
const path = require('path');

const gcePath = path.join(__dirname, '..', 'data', 'sem-1', 'general-communicative-english', 'gce-sem1.json');
const origData = JSON.parse(fs.readFileSync(gcePath, 'utf8'));

// Helper to compute spans automatically from substrings
function makeSpans(text, targets) {
  const spans = [];
  targets.forEach(({ str, style }) => {
    let index = text.indexOf(str);
    while (index !== -1) {
      spans.push({
        start: index,
        end: index + str.length,
        style: style || 'underline'
      });
      index = text.indexOf(str, index + str.length);
    }
  });
  return spans;
}

// Helper to make paragraph with automatic underline spans
function p(text, underlineTerms = [], boldTerms = []) {
  const targets = [
    ...underlineTerms.map(t => ({ str: t, style: 'underline' })),
    ...boldTerms.map(t => ({ str: t, style: 'bold' }))
  ];
  return {
    blockType: 'paragraph',
    text: text,
    spans: makeSpans(text, targets)
  };
}

function heading(text) {
  return { blockType: 'heading', text };
}

function subheading(text) {
  return { blockType: 'subheading', text };
}

function note(text, underlineTerms = []) {
  return {
    blockType: 'note',
    text: text,
    spans: makeSpans(text, underlineTerms.map(t => ({ str: t, style: 'underline' })))
  };
}

function listItem(text, underlineTerms = [], boldTerms = []) {
  const targets = [
    ...underlineTerms.map(t => ({ str: t, style: 'underline' })),
    ...boldTerms.map(t => ({ str: t, style: 'bold' }))
  ];
  return {
    text: text,
    spans: makeSpans(text, targets)
  };
}

function list(items, listStyle = 'decimal') {
  return {
    blockType: 'list',
    listStyle: listStyle,
    items: items
  };
}

function table(tableCaption, tableHeaders, tableRows) {
  return {
    blockType: 'table',
    tableCaption,
    tableHeaders,
    tableRows
  };
}

function diagram(diagramTitle, diagramCaption, diagramSvgOrUrl) {
  return {
    blockType: 'diagram',
    diagramTitle,
    diagramCaption,
    diagramSvgOrUrl
  };
}

// Keep Q1 to Q13 exactly as they are
const unit1Questions = origData.questions.filter(q => q.unit === 'Unit 1');

// Unit 2 Questions
const unit2Questions = [
  {
    id: "eng-u2-q14",
    questionNumber: "Q.14",
    questionText: "What is Listening? How is it different from hearing?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "Listening is the receiver's activity in communication where the listener has the responsibility to be attentive and to make an effort to understand the speaker's meaning. It is an active cognitive process of paying attention to, understanding, and interpreting what is heard.",
        ["Listening", "receiver's activity", "active cognitive process"]
      ),
      p(
        "In contrast, Hearing is a passive, involuntary physiological process of perceiving sounds through the ears without requiring conscious awareness or mental effort. In short: Hearing = Receiving sounds, while Listening = Understanding the meaning of those sounds.",
        ["Hearing", "physiological process", "Hearing = Receiving sounds", "Listening = Understanding the meaning of those sounds"]
      )
    ]
  },
  {
    id: "eng-u2-q15",
    questionNumber: "Q.15",
    questionText: "What is Feedback in Listening?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "Feedback is the verbal or nonverbal response from a listener that communicates their understanding or reaction to a sender's message. It acts as a crucial component of active listening, providing information about how the sender's message was received and understood.",
        ["Feedback", "verbal or nonverbal response", "active listening"]
      ),
      p(
        "In English communication, feedback can be: (1) Positive feedback (praises what was done well), (2) Constructive feedback (suggests specific improvements), or (3) Corrective feedback (points out errors and provides the correct form).",
        ["Positive feedback", "Constructive feedback", "Corrective feedback"]
      )
    ]
  },
  {
    id: "eng-u2-q16",
    questionNumber: "Q.16",
    questionText: "What is meant by Listening for Global Information?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "Listening for global information means listening to comprehend the overall idea, central theme, broad context, or general message of a conversation, speech, or lecture, rather than focusing on isolated details or specific statistical facts.",
        ["Listening for global information", "overall idea", "central theme"]
      ),
      p(
        "It enables the listener to grasp the gist and overarching purpose of the discourse without getting bogged down by unfamiliar words or secondary minutiae.",
        ["gist", "overarching purpose"]
      )
    ]
  },
  {
    id: "eng-u2-q17",
    questionNumber: "Q.17",
    questionText: "What is meant by Listening for Specific Information?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "Listening for specific information is a targeted, selective listening skill where the listener focuses exclusively on extracting precise details—such as names, dates, times, numerical data, locations, or clear instructions—while intentionally filtering out irrelevant background talk.",
        ["Listening for specific information", "selective listening skill"]
      ),
      p(
        "Example: Listening carefully to an airport departure announcement solely to note your specific boarding gate and flight departure time.",
        ["airport departure announcement"],
        ["Example:"]
      )
    ]
  },
  {
    id: "eng-u2-q18",
    questionNumber: "Q.18",
    questionText: "What is Listening for Gist?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "The gist is the central or core meaning of a message, conversation, or text. It is the most essential information, stripped of all secondary details, examples, and filler words. In simpler terms, it is the crux of a communication—the most important takeaway distilled from the whole.",
        ["gist", "central or core meaning", "crux"]
      ),
      p(
        "Listening for gist means you have grasped the speaker's main point and overall communicative purpose without getting lost in the specifics.",
        ["grasped the speaker's main point"]
      )
    ]
  },
  {
    id: "eng-u2-q19",
    questionNumber: "Q.19",
    questionText: "What is meant by Deduction of Meaning while listening?",
    marks: 2,
    unit: "Unit 2",
    type: "short",
    answer: [
      p(
        "Deduction of meaning is the cognitive ability to deduce or infer the meaning of unfamiliar words, expressions, or unstated implications from context clues, tone of voice, facial expressions, and the communicative situation.",
        ["Deduction of meaning", "infer the meaning", "context clues"]
      ),
      p(
        "It allows a listener to maintain unbroken comprehension during lectures or conversations without stopping to look up every unfamiliar word.",
        ["unbroken comprehension"]
      )
    ]
  },
  {
    id: "eng-u2-q20",
    questionNumber: "Q.20",
    questionText: "Explain the distinction between Hearing and Listening. Discuss the importance of effective listening in communication.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("1. Concepts of Listening and Hearing"),
      p(
        "Listening is the receiver's activity in communication. As the speaker has the responsibility to make an effort to be understood, so the listener has the responsibility to be attentive and to make an effort to understand the speaker's meaning. While hearing is merely receiving sounds through the ears, listening is understanding the meaning of those sounds.",
        ["receiver's activity in communication", "Hearing = Receiving sounds", "Listening = Understanding the meaning of those sounds"]
      ),
      heading("2. The Hearing-Listening Distinction"),
      table(
        "Table: Distinction Between Hearing and Listening",
        ["Parameter", "Hearing", "Listening"],
        [
          [
            "Basic Definition",
            "Hearing is the physical ability to detect sounds through the ears.",
            "Listening is the active process of paying attention to, understanding, and interpreting what is heard."
          ],
          [
            "Nature of Process",
            "A physiological process that perception occurs passively and automatically.",
            "A cognitive process that is active and intentional, requiring conscious focus."
          ],
          [
            "Effort & Awareness",
            "Happens involuntarily when sound waves reach ears; no conscious effort needed.",
            "Requires concentration, mental effort, and conscious awareness."
          ],
          [
            "Comprehension",
            "No understanding is necessary; limited to reception of sound stimuli.",
            "Comprehending, interpreting, and assigning meaning to sounds are essential."
          ],
          [
            "Engagement & Response",
            "Does not necessarily involve engagement or response to what is heard.",
            "Involves actively engaging with speaker and providing appropriate feedback."
          ],
          [
            "Setting & Context",
            "Can happen in casual spaces, public areas, or as background noise.",
            "Occurs in communication settings like meetings, lectures, or conversations."
          ],
          [
            "Practical Example",
            "You hear traffic noise while walking down the street.",
            "You carefully listen to a teacher explaining a lesson in class."
          ]
        ]
      ),
      note(
        "Core Rule: Hearing = Receiving sounds | Listening = Understanding the meaning of those sounds.",
        ["Hearing = Receiving sounds", "Listening = Understanding the meaning of those sounds"]
      ),
      heading("3. Importance of Effective Listening in Communication"),
      p(
        "Listening is the single most utilized communication activity in professional life. An executive's communication time is spent roughly in the following proportion:",
        ["proportion"]
      ),
      list([
        listItem("Listening: 45% of total communication time (the largest share)", ["Listening: 45%"], ["Listening: 45%"]),
        listItem("Speaking: 30% of total communication time", ["Speaking: 30%"], ["Speaking: 30%"]),
        listItem("Reading: 16% of total communication time", ["Reading: 16%"], ["Reading: 16%"]),
        listItem("Writing: 9% of total communication time", ["Writing: 9%"], ["Writing: 9%"])
      ], "decimal"),
      subheading("Essential Factors of Listening Skills"),
      list([
        listItem("Active Listening: Involves being fully present, showing interest through eye contact and body language, and paraphrasing to ensure understanding.", ["Active Listening:"], ["Active Listening:"]),
        listItem("Focus and Attention: Paying undivided attention to the speaker, avoiding distractions, and focusing on verbal and nonverbal cues.", ["Focus and Attention:"], ["Focus and Attention:"]),
        listItem("Understanding Perspectives: Listening to understand the speaker's message and underlying emotions, rather than formulating a response immediately.", ["Understanding Perspectives:"], ["Understanding Perspectives:"]),
        listItem("Nonverbal Cues: Being aware of and interpreting body language, facial expressions, and tone of voice to gain deeper understanding.", ["Nonverbal Cues:"], ["Nonverbal Cues:"]),
        listItem("Feedback: Providing verbal and nonverbal feedback to show engagement and validate comprehension.", ["Feedback:"], ["Feedback:"]),
        listItem("Asking Questions: Using open-ended questions to encourage further elaboration and clarification.", ["Asking Questions:"], ["Asking Questions:"]),
        listItem("Avoiding Distractions: Refraining from interrupting, judging, or prematurely formulating a response.", ["Avoiding Distractions:"], ["Avoiding Distractions:"]),
        listItem("Summarising and Paraphrasing: Repeating back what the speaker has said in your own words to ensure comprehension.", ["Summarising and Paraphrasing:"], ["Summarising and Paraphrasing:"])
      ], "roman")
    ]
  },
  {
    id: "eng-u2-q21",
    questionNumber: "Q.21",
    questionText: "Explain the different stages of the Listening Process with suitable examples.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("The Five Stages of the Listening Process"),
      p(
        "Listening is a sequential, five-stage active cognitive process through which incoming auditory signals are perceived, interpreted, retained, assessed, and responded to.",
        ["five-stage active cognitive process"]
      ),
      table(
        "Table: Overview of the 5 Stages of Active Listening",
        ["Stage", "Name", "Core Activity"],
        [
          ["Stage 1", "Receiving (Hearing)", "Focus solely on hearing the message while filtering out distractions."],
          ["Stage 2", "Understanding (Interpretation)", "Comprehend and interpret the speaker's message correctly."],
          ["Stage 3", "Remembering (Retaining)", "Retain and store key points of the message in memory for later use."],
          ["Stage 4", "Evaluating (Assessment)", "Assess the message's value, truth, and credibility."],
          ["Stage 5", "Responding (Feedback)", "Provide feedback (verbal or nonverbal) to validate the message."]
        ]
      ),
      diagram(
        "Stages of the Listening Process",
        "The five sequential stages of active listening from sound reception to feedback.",
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 120" width="100%" height="100%"><rect width="100%" height="100%" fill="#f8fafc" rx="8"/><g transform="translate(15, 35)" font-family="Times New Roman, serif" font-size="12" font-weight="bold" text-anchor="middle"><rect x="0" y="0" width="125" height="50" rx="6" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.5"/><text x="62" y="24" fill="#0f172a">1. Receiving</text><text x="62" y="39" fill="#475569" font-size="10" font-weight="normal">(Hearing)</text><path d="M 125 25 L 150 25" stroke="#1e3a8a" stroke-width="1.5" fill="none" marker-end="url(#arr)"/><rect x="155" y="0" width="125" height="50" rx="6" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.5"/><text x="217" y="24" fill="#0f172a">2. Understanding</text><text x="217" y="39" fill="#475569" font-size="10" font-weight="normal">(Interpretation)</text><path d="M 280 25 L 305 25" stroke="#1e3a8a" stroke-width="1.5" fill="none" marker-end="url(#arr)"/><rect x="310" y="0" width="125" height="50" rx="6" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.5"/><text x="372" y="24" fill="#0f172a">3. Remembering</text><text x="372" y="39" fill="#475569" font-size="10" font-weight="normal">(Retention)</text><path d="M 435 25 L 460 25" stroke="#1e3a8a" stroke-width="1.5" fill="none" marker-end="url(#arr)"/><rect x="465" y="0" width="125" height="50" rx="6" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.5"/><text x="527" y="24" fill="#0f172a">4. Evaluating</text><text x="527" y="39" fill="#475569" font-size="10" font-weight="normal">(Judgement)</text><path d="M 590 25 L 615 25" stroke="#1e3a8a" stroke-width="1.5" fill="none" marker-end="url(#arr)"/><rect x="620" y="0" width="125" height="50" rx="6" fill="#ffffff" stroke="#1e3a8a" stroke-width="1.5"/><text x="682" y="24" fill="#0f172a">5. Responding</text><text x="682" y="39" fill="#475569" font-size="10" font-weight="normal">(Feedback)</text></g><defs><marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill="#1e3a8a"/></marker></defs></svg>`
      ),
      heading("Detailed Explanation of Each Step"),
      list([
        listItem(
          "Step 1: Hearing (Receiving) — It is the first step of listening. At this stage, the listener simply attends to the speaker to hear the message. If you can repeat the speaker's words, you have heard the message. This step may fail if there is a great deal of noise or if the listener is occupied with something else.",
          ["Step 1: Hearing (Receiving)"],
          ["Step 1: Hearing (Receiving) —"]
        ),
        listItem(
          "Step 2: Interpretation (Understanding) — The second step is interpretation. This depends on the listener's vocabulary, knowledge, and background. If the listener fails to interpret words correctly, the message is misunderstood. People misinterpret words because of varying knowledge, vocabulary, experience, attitudes, culture, and background. A listener may also fail to note or may misinterpret the speaker's body language.",
          ["Step 2: Interpretation (Understanding)"],
          ["Step 2: Interpretation (Understanding) —"]
        ),
        listItem(
          "Step 3: Evaluation — The third step is evaluation. At this stage, the listener decides what to do with the received information. When you are listening to a sales talk, you may choose to believe or not to believe what you hear. The judgements you make at the evaluation stage are crucial to the listening process.",
          ["Step 3: Evaluation"],
          ["Step 3: Evaluation —"]
        ),
        listItem(
          "Step 4: Remembering — This involves storing the received, understood, and evaluated information in your memory for later recall and use. Without retention, the communication fails to produce long-term results.",
          ["Step 4: Remembering"],
          ["Step 4: Remembering —"]
        ),
        listItem(
          "Step 5: Response — The final step is response. The listener's response to the message may be in words (verbal) or in body language (nonverbal, such as nodding or smiling). The response lets the speaker know whether the listener has got the message and what his or her reaction is.",
          ["Step 5: Response"],
          ["Step 5: Response —"]
        )
      ], "decimal")
    ]
  },
  {
    id: "eng-u2-q22",
    questionNumber: "Q.22",
    questionText: "Explain how listening skills can be developed. Discuss listening for gist, identifying main points, and deducing meaning.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("1. Techniques of Active Listening / How to Improve Listening Skills"),
      p(
        "Active listening is a key component of effective communication and interpersonal skills. By mastering these eight techniques, a person can develop powerful listening skills and foster open communication:",
        ["Active listening", "eight techniques"]
      ),
      list([
        listItem("Be fully present and attentive: Give full attention to the speaker, minimise distractions, maintain eye contact, and focus on words, tone, and nonverbal cues.", ["Be fully present and attentive:"], ["Be fully present and attentive:"]),
        listItem("Use positive body language and nonverbal cues: Maintain an open posture, lean in slightly, and use encouraging cues like nodding and smiling.", ["Use positive body language and nonverbal cues:"], ["Use positive body language and nonverbal cues:"]),
        listItem("Avoid interrupting or judging: Resist the urge to interrupt or rush to judgment; allow the speaker to express thoughts without interjecting personal biases.", ["Avoid interrupting or judging:"], ["Avoid interrupting or judging:"]),
        listItem("Paraphrase and reflect to show understanding: Restate the speaker's main points in your own words to ensure you have understood them correctly.", ["Paraphrase and reflect to show understanding:"], ["Paraphrase and reflect to show understanding:"]),
        listItem("Ask clarifying and open-ended questions: Encourage elaboration by asking questions like: 'Tell me more about that', 'How did you feel?', 'What can I do to help?'", ["Ask clarifying and open-ended questions:"], ["Ask clarifying and open-ended questions:"]),
        listItem("Validate the speaker's perspective and emotions: Acknowledge how the speaker feels with empathy, even if you do not necessarily agree with their view.", ["Validate the speaker's perspective and emotions:"], ["Validate the speaker's perspective and emotions:"]),
        listItem("Withhold advice unless asked: Your primary role is to understand, not to advise. Refrain from offering unsolicited solutions unless requested.", ["Withhold advice unless asked:"], ["Withhold advice unless asked:"]),
        listItem("Summarise key points and action items: Towards the end, summarise the main themes and agreed action points to confirm mutual understanding.", ["Summarise key points and action items:"], ["Summarise key points and action items:"])
      ], "decimal"),
      heading("2. Understanding the Concept of 'Gist'"),
      p(
        "The gist is the central or core meaning of a message, conversation, or text. It is the most essential information, stripped of all secondary details, examples, and filler words. Understanding the gist means grasping the main point without getting lost in specifics.",
        ["gist", "central or core meaning"]
      ),
      subheading("Steps to Deducing the Gist"),
      list([
        listItem("Identify the Purpose: Determine why the text was written or spoken.", ["Identify the Purpose:"], ["Identify the Purpose:"]),
        listItem("Focus on the Main Idea: Look for the central theme or argument the speaker is conveying.", ["Focus on the Main Idea:"], ["Focus on the Main Idea:"]),
        listItem("Eliminate Redundant Information: Disregard secondary examples, anecdotes, or unnecessary descriptions.", ["Eliminate Redundant Information:"], ["Eliminate Redundant Information:"]),
        listItem("Summarise: Condense the content into one or two clear sentences.", ["Summarise:"], ["Summarise:"])
      ], "roman"),
      subheading("Importance of Gist in Communication"),
      p(
        "1. Clarity and Efficiency: Communicates the core takeaway swiftly in headlines, abstracts, and pitches without clutter. 2. Retention and Recall: Cognitive psychology confirms that the human brain prioritises storing and recalling the gist first before remembering specific details.",
        ["Clarity and Efficiency", "Retention and Recall"]
      ),
      heading("3. Identifying Main Points and Deducing Meaning"),
      subheading("Identifying Main Points"),
      p(
        "Listeners must differentiate between core arguments and supporting evidence. Signpost phrases (e.g., 'The crucial factor is', 'In summary') highlight key ideas.",
        ["core arguments", "supporting evidence"]
      ),
      subheading("Deducing Meaning"),
      p(
        "When encountering unfamiliar vocabulary or implied messages, listeners deduce meaning using contextual clues, speaker inflection, and situational factors.",
        ["Deducing Meaning", "contextual clues"]
      )
    ]
  },
  {
    id: "eng-u2-q23",
    questionNumber: "Q.23",
    questionText: "Explain the different purposes/types of listening: listening for specific information and listening for global information.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("1. Listening for Specific vs. Global Information"),
      table(
        "Table: Comparison Between Listening for Specific and Global Information",
        ["Parameter", "Listening for Specific Information", "Listening for Global Information"],
        [
          [
            "Primary Objective",
            "To catch precise, isolated facts (names, numbers, dates, timings, directions).",
            "To comprehend the broad theme, central argument, and overall gist."
          ],
          [
            "Listening Technique",
            "Selective and targeted; scans audio for pre-determined trigger words.",
            "Comprehensive and holistic; follows the continuous flow of discourse."
          ],
          [
            "Handling Unrelated Talk",
            "Filters out and disregards redundant background conversation.",
            "Synthesizes background context to understand the speaker's total perspective."
          ],
          [
            "Practical Scenarios",
            "Listening for train platform announcements, stock quotes, or a phone number.",
            "Listening to a conference keynote, classroom lecture, or general story."
          ]
        ]
      ),
      heading("2. The Seven Types of Listening (Course Content 2.5)"),
      list([
        listItem("Active Listening: Involves fully focusing on the speaker, giving undivided attention, and responding thoughtfully. It requires engaging through verbal and non-verbal signs (nodding, eye contact, feedback) and is crucial in problem-solving and team discussions.", ["Active Listening:"], ["Active Listening:"]),
        listItem("Passive Listening: Occurs when the listener hears the words but does not engage or respond. A relaxed form used in casual settings where information is absorbed without immediate action, though overusing it can cause missed details.", ["Passive Listening:"], ["Passive Listening:"]),
        listItem("Critical Listening: Involves analysing and evaluating the information presented to determine its validity, evidence, and logical importance before forming an opinion or making a decision.", ["Critical Listening:"], ["Critical Listening:"]),
        listItem("Empathetic Listening: Goes beyond understanding words to tune into the speaker's emotions, feelings, and intentions. It provides emotional support and builds connection in counselling and personal relationships.", ["Empathetic Listening:"], ["Empathetic Listening:"]),
        listItem("Appreciative Listening: Focuses on enjoying the sounds and messages delivered, such as listening to music, poetry, speeches, or storytelling for pleasure and relaxation.", ["Appreciative Listening:"], ["Appreciative Listening:"]),
        listItem("Selective Listening: Occurs when the listener focuses only on certain parts of interest while ignoring the rest. It helps filter noise, but can lead to incomplete knowledge if essential context is missed.", ["Selective Listening:"], ["Selective Listening:"]),
        listItem("Informational Listening: Focused on learning or gathering knowledge in educational or professional settings. Requires paying close attention to details, taking notes, and asking clarifying questions.", ["Informational Listening:"], ["Informational Listening:"])
      ], "roman")
    ]
  },
  {
    id: "eng-u2-q24",
    questionNumber: "Q.24",
    questionText: "Explain the techniques of listening to different forms of communication, such as a conversation, speech, and lecture. Also discuss the role of feedback in effective listening.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("1. Listening to Different Forms of Communication"),
      subheading("A. Listening to a Conversation"),
      p(
        "Conversations are interactive two-way exchanges defined by situational context, participant roles, and conversational turn-taking. Effective conversation listening requires active engagement, observing nonverbal cues, and maintaining dialogue without dominating.",
        ["interactive two-way exchanges", "situational context"]
      ),
      subheading("B. Listening to a Speech vs. a Lecture"),
      p(
        "A lecture is an academic listening context designed to transmit expert information to learners, usually held for 1 to 2 hours. A speech and a lecture differ fundamentally in purpose, delivery, and audience relationship:",
        ["academic listening context"]
      ),
      table(
        "Table: Differences Between a Speech and a Lecture (Course Content 2.9.1.1)",
        ["Feature", "Speech", "Lecture"],
        [
          [
            "Script & Delivery",
            "Has a script or detailed outline; depends on specific words chosen to move and persuade.",
            "Depends on the order of information; actual words conveying information can be improvised."
          ],
          [
            "Primary Purpose",
            "Speeches Persuade: Relies on emotional pleas, earnestness, and rhetorical techniques.",
            "Lectures Inform: Aims solely to inform; shares expertise rather than conviction."
          ],
          [
            "Speaker's Role",
            "The Speaker is a Leader: Seeks agreement with their personal point of view.",
            "The Lecturer is a Teacher: Clarifies available options so listeners can make up their minds."
          ],
          [
            "Audience Connection",
            "Forms an emotional bond; audience feels they know and like the speaker.",
            "Encourages intellectual understanding; audience appreciates the new understanding reached."
          ]
        ]
      ),
      heading("2. Feedback in Listening (Course Content 2.13)"),
      p(
        "Feedback is the verbal or nonverbal response from a listener that communicates their understanding or reaction to a sender's message. It completes the communication loop.",
        ["Feedback", "verbal or nonverbal response"]
      ),
      subheading("Types of Listening Feedback"),
      list([
        listItem("Verbal Feedback: Paraphrasing (restating message in own words), Questioning (asking sincere open-ended questions), Analysing (tentatively interpreting meaning to help), Evaluating (appraising thoughts/behaviour constructively), Advising (providing guidance when explicitly asked).", ["Verbal Feedback:"], ["Verbal Feedback:"]),
        listItem("Non-Verbal Feedback: Nodding (shows agreement/following along), Eye Contact (shows interest and attentiveness), Facial Expressions (warm, smiling, or concentrated), Body Language (open posture, leaning slightly forward), Silence (allows speaker space to continue).", ["Non-Verbal Feedback:"], ["Non-Verbal Feedback:"])
      ], "roman"),
      subheading("Effective Feedback Strategies"),
      list([
        listItem("Be Specific and Descriptive: Give precise examples rather than vague praise ('Good job').", ["Be Specific and Descriptive:"], ["Be Specific and Descriptive:"]),
        listItem("Be Constructive: Focus on behaviour, not personality, offering actionable steps for growth.", ["Be Constructive:"], ["Be Constructive:"]),
        listItem("Be Timely: Deliver feedback soon after the event for maximum relevance and retention.", ["Be Timely:"], ["Be Timely:"]),
        listItem("Be Balanced: Balance positive reinforcement with constructive suggestions.", ["Be Balanced:"], ["Be Balanced:"]),
        listItem("Practice 'I' Statements: Use 'I felt concerned when...' rather than accusatory 'You made me feel...'.", ["Practice 'I' Statements:"], ["Practice 'I' Statements:"]),
        listItem("Listen Actively: Treat feedback as a two-way dialogue, remaining open to mutual discussion.", ["Listen Actively:"], ["Listen Actively:"])
      ], "decimal")
    ]
  },
  {
    id: "eng-u2-q25",
    questionNumber: "Q.25",
    questionText: "What are the barriers to listening? Explain them in detail.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("Barriers to Effective Listening (Course Content 2.6)"),
      p(
        "Listening is not an automatic or inborn skill; it requires active mental concentration. Various obstacles can hinder accurate reception and interpretation of a message. The seven major barriers to listening are:",
        ["seven major barriers to listening"]
      ),
      list([
        listItem(
          "Physiological Barriers: Arise from genuine physical hearing problems, ear deficiencies, or cognitive memory limitations in processing and retaining incoming information. For example, hearing impairment or lack of concentration/interest.",
          ["Physiological Barriers:"],
          ["Physiological Barriers:"]
        ),
        listItem(
          "Physical Barriers: Environmental or bodily obstacles including: (a) Distractions: Environmental noise, loud machinery, or messy surroundings. (b) Information Overload: Being bombarded with too much data simultaneously. (c) Physical Discomfort: Illness, headache, exhaustion, or hunger.",
          ["Physical Barriers:"],
          ["Physical Barriers:"]
        ),
        listItem(
          "Attitudinal Barriers: Arise from personal mindsets, such as preoccupation with private problems, close-mindedness, or egocentrism—the false belief that the listener already knows more than the speaker and has nothing new to learn.",
          ["Attitudinal Barriers:"],
          ["Attitudinal Barriers:"]
        ),
        listItem(
          "Cultural Barriers: Unfamiliar accents, regional dialects, and varying pronunciation habits that interfere with decoding words accurately, both across different cultures and within subcultures.",
          ["Cultural Barriers:"],
          ["Cultural Barriers:"]
        ),
        listItem(
          "Gender Barriers: Research indicates men and women often listen with different orientations: women frequently listen for emotions and interpersonal nuances behind words, whereas men tend to listen primarily for facts, logic, and content.",
          ["Gender Barriers:"],
          ["Gender Barriers:"]
        ),
        listItem(
          "Lack of Training: Listening is a learned skill, not an inborn reflex. Without proper training, individuals selectively listen only to interesting topics and avoid difficult, boring, or complex messages.",
          ["Lack of Training:"],
          ["Lack of Training:"]
        ),
        listItem(
          "Psychological Barriers: Internal mental hurdles such as prejudice, defensiveness, personal ego, daydreaming, mentally rehearsing a retort, or general indifference that block receptive communication.",
          ["Psychological Barriers:"],
          ["Psychological Barriers:"]
        )
      ], "roman"),
      note(
        "Remedy: Active listening training, minimizing noise, cultivating an open mind, and empathetic engagement can overcome these seven barriers.",
        ["Active listening training"]
      )
    ]
  },
  {
    id: "eng-u2-q26",
    questionNumber: "Q.26",
    questionText: "What are Communicative Functions? Explain their various types with suitable examples.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("Communicative Functions (Course Content 2.9)"),
      p(
        "Communicative functions refer to the specific social purposes and intentions for which people use language in everyday interactions. Language is not merely a collection of words, but an active tool used to accomplish goals, express needs, and establish relationships.",
        ["Communicative functions", "social purposes and intentions"]
      ),
      heading("The Six Key Communicative Functions"),
      list([
        listItem(
          "1. Requesting: Communicating to ask for a preferred person, activity, object, assistance, or need. Example: Requesting a coworker's help on a project, asking for a specific coffee with milk and sugar, or asking for attention from friends.",
          ["1. Requesting:"],
          ["1. Requesting:"]
        ),
        listItem(
          "2. Protesting: Communicating to reject, oppose, or decline things we do not want. Example: Rejecting unwanted food, refusing a task when exhausted, or protesting an inconvenient meeting schedule.",
          ["2. Protesting:"],
          ["2. Protesting:"]
        ),
        listItem(
          "3. Describing: Labelling objects, explaining characteristics, or expressing specific desires. It enriches communication clarity. Example: Detailing the exact specifications of items needed from a store or describing a favourite book.",
          ["3. Describing:"],
          ["3. Describing:"]
        ),
        listItem(
          "4. Asking and Answering Questions: Using the '5 Wh' questions (Who, What, Where, When, Why) along with 'How', 'Can', 'Do', and yes/no formats to discover information, exchange ideas, and build conversational rapport.",
          ["4. Asking and Answering Questions:"],
          ["4. Asking and Answering Questions:"]
        ),
        listItem(
          "5. Commenting: Social interaction to share reactions, feelings, or observations about events and environment. Example: Saying 'wow' when seeing something impressive, or discussing a sports match with colleagues.",
          ["5. Commenting:"],
          ["5. Commenting:"]
        ),
        listItem(
          "6. Expressing Feelings: Sharing physical or emotional states (e.g., happy, tired, excited, anxious, or describing localized bodily pain such as a throbbing headache).",
          ["6. Expressing Feelings:"],
          ["6. Expressing Feelings:"]
        )
      ], "decimal")
    ]
  },
  {
    id: "eng-u2-q27",
    questionNumber: "Q.27",
    questionText: "Write explanatory notes on: (a) Situational Conversation (b) Extempore speaking.",
    marks: 7,
    unit: "Unit 2",
    type: "detail",
    answer: [
      heading("(a) Situational Conversation (Course Content 2.11)"),
      p(
        "Situational conversation refers to a dialogue that takes place within a specific context or setting where the participants' roles, the topic, and the expected tone are defined by the situation itself. It is not just casual talk; the physical environment and underlying purpose directly govern what is said and how it is said.",
        ["Situational conversation", "specific context or setting"]
      ),
      subheading("Examples of Situational Conversations"),
      list([
        listItem("Workplace Discussions: Performance appraisals, team meetings, client project negotiations.", ["Workplace Discussions:"], ["Workplace Discussions:"]),
        listItem("Customer Service: Ordering food at a restaurant, seeking help in a retail store, calling tech support.", ["Customer Service:"], ["Customer Service:"]),
        listItem("Personal & Professional Interactions: Job interviews, teacher-parent meetings, consultations with a landlord.", ["Personal & Professional Interactions:"], ["Personal & Professional Interactions:"])
      ], "roman"),
      heading("(b) Extempore Speaking (Course Content 2.12)"),
      p(
        "Extempore is a form of public speaking where the speaker is given a topic with little to no preparation time. Derived from the Latin 'ex tempore' ('out of the moment' or 'on the spur of the moment'). Unlike impromptu speaking where the topic is completely unknown until the moment of speaking, extempore provides a brief preparation window (typically 3 to 5 minutes) to organize thoughts.",
        ["Extempore", "ex tempore", "3 to 5 minutes"]
      ),
      subheading("Core Elements of Extempore"),
      list([
        listItem("Limited Preparation: The speaker receives 3–5 minutes to outline key points, preventing scripted or memorized delivery.", ["Limited Preparation:"], ["Limited Preparation:"]),
        listItem("On-the-Spot Thinking: Requires rapid analysis, brainstorming, and logical prioritization under time pressure.", ["On-the-Spot Thinking:"], ["On-the-Spot Thinking:"]),
        listItem("Structured Delivery: Demands a clear structure: an engaging introduction, a body with 2–3 main points supported by examples, and a concise conclusion.", ["Structured Delivery:"], ["Structured Delivery:"]),
        listItem("Fluency and Adaptability: Delivered naturally and conversationally without notes, adapting smoothly to audience responses.", ["Fluency and Adaptability:"], ["Fluency and Adaptability:"])
      ], "decimal")
    ]
  },
  {
    id: "eng-u2-q28",
    questionNumber: "Q.28",
    questionText: "Why does reading out loud help? Discuss loud reading for pronunciation and fluency.",
    marks: 4,
    unit: "Unit 2",
    type: "short",
    answer: [
      heading("Benefits of Reading Out Loud (Course Content 2.10)"),
      p(
        "Reading out loud engages different parts of the brain compared to reading silently. During silent reading, it is easy to glance over words without sounding them out. In contrast, reading out loud forces the reader to pronounce every single word correctly, training the mouth, lips, and tongue to produce authentic vocal sounds.",
        ["Reading out loud", "pronounce every single word correctly"]
      ),
      subheading("Loud Reading for Pronunciation and Fluency"),
      list([
        listItem("Builds Neural Connections: Verbalizing printed words strengthens the mental association between letter combinations and phonetic sounds, fostering natural pronunciation in everyday speech.", ["Builds Neural Connections:"], ["Builds Neural Connections:"]),
        listItem("Develops Reading Fluency: Vocalizing text obligates the reader to maintain a steady cadence, focus intently on each word, and decode unfamiliar words rapidly.", ["Develops Reading Fluency:"], ["Develops Reading Fluency:"]),
        listItem("Masters Intonation and Expression: Practicing loud reading instills appropriate voice modulation, rhythm, and sentence pauses, which are essential for sounding natural, confident, and professional.", ["Masters Intonation and Expression:"], ["Masters Intonation and Expression:"])
      ], "roman")
    ]
  }
];

// Unit 3 Questions (Reading & Writing)
const unit3Questions = [
  {
    id: "eng-u3-q29",
    questionNumber: "Q.29",
    questionText: "Skimming",
    marks: 2,
    unit: "Unit 3",
    type: "short",
    answer: [
      p(
        "Skimming is a rapid reading technique where the reader glances quickly over a text to identify the general theme, core message, or gist, without reading every word or analyzing supporting details.",
        ["Skimming", "rapid reading technique", "gist"]
      ),
      p(
        "Example: Glancing through newspaper headlines, section titles, and opening sentences in the morning to understand the day's major news.",
        ["newspaper headlines"],
        ["Example:"]
      )
    ]
  },
  {
    id: "eng-u3-q30",
    questionNumber: "Q.30",
    questionText: "Scanning",
    marks: 2,
    unit: "Unit 3",
    type: "short",
    answer: [
      p(
        "Scanning is a fast, targeted reading technique used to locate a specific piece of information (such as a date, name, number, statistic, or formula) within a text, while ignoring irrelevant sections.",
        ["Scanning", "targeted reading technique", "specific piece of information"]
      ),
      p(
        "Example: Searching through a telephone directory, flight schedule, or textbook index to locate a particular entry.",
        ["telephone directory"],
        ["Example:"]
      )
    ]
  },
  {
    id: "eng-u3-q31",
    questionNumber: "Q.31",
    questionText: "Write the difference between skimming and scanning.",
    marks: 7,
    unit: "Unit 3",
    type: "detail",
    answer: [
      heading("Comparison Between Skimming and Scanning"),
      table(
        "Table: Comprehensive Distinction Between Skimming and Scanning",
        ["Parameter", "Skimming", "Scanning"],
        [
          [
            "Primary Objective",
            "To gain a general overview, main idea, or gist of the text.",
            "To locate a specific fact, figure, name, or piece of data."
          ],
          [
            "Reading Technique",
            "Reads headings, subheadings, topic sentences, and summary paragraphs quickly.",
            "Moves eyes rapidly down the page searching exclusively for target keywords or numbers."
          ],
          [
            "Comprehension Level",
            "Broad, macro-level understanding of the text's overall message.",
            "Isolated, micro-level data extraction; zero focus on general meaning."
          ],
          [
            "Reading Speed",
            "Very fast (3 to 4 times faster than normal reading pace).",
            "Extremely rapid; searching stops as soon as the target datum is spotted."
          ],
          [
            "Material Types",
            "Articles, book chapters, business reports, magazine reviews.",
            "Dictionaries, timetables, directories, index pages, price lists."
          ],
          [
            "Practical Example",
            "Reviewing an executive proposal to understand the business strategy.",
            "Looking up a train arrival time on a station schedule board."
          ]
        ]
      ),
      note(
        "Summary: Skimming reads for the gist; scanning searches for the fact.",
        ["Skimming reads for the gist", "scanning searches for the fact"]
      )
    ]
  },
  {
    id: "eng-u3-q32",
    questionNumber: "Q.32",
    questionText: "What is reading? Explain the four types of reading.",
    marks: 7,
    unit: "Unit 3",
    type: "detail",
    answer: [
      heading("1. Definition of Reading"),
      p(
        "Reading is an active, cognitive decoding process of interpreting written or printed symbols into intelligible words and constructing meaning. It involves word recognition, semantic understanding, contextual inference, and critical evaluation to assimilate knowledge.",
        ["Reading", "cognitive decoding process", "constructing meaning"]
      ),
      heading("2. The Four Types of Reading"),
      p(
        "In communicative English and study skills, reading is classified into four fundamental types based on speed, purpose, and depth of comprehension:",
        ["four fundamental types"]
      ),
      list([
        listItem(
          "1. Skimming (Reading for Gist) — A rapid reading technique employed to obtain an overall view, central theme, or gist of a text in minimal time without focusing on minute details. The reader attends to headings, introductory sentences, bullet points, and concluding remarks. Example: Quickly previewing a long business report before an executive meeting.",
          ["1. Skimming (Reading for Gist)"],
          ["1. Skimming (Reading for Gist) —"]
        ),
        listItem(
          "2. Scanning (Reading for Specific Data) — A targeted reading technique used when the reader searches for a specific piece of information (such as a name, date, statistic, or phone number) without reading the entire document. The eyes dart across lines to spot the required keyword. Example: Searching for a specific name on an attendance list or looking up a word in a dictionary.",
          ["2. Scanning (Reading for Specific Data)"],
          ["2. Scanning (Reading for Specific Data) —"]
        ),
        listItem(
          "3. Intensive Reading (Deep / Analytical Reading) — Slow, careful, highly focused reading aimed at total and thorough comprehension of every sentence, grammatical construction, and technical argument. It involves critical analysis, note-taking, and vocabulary lookup. Example: Reading a legal contract, business case study, financial audit report, or textbook chapter for exam preparation.",
          ["3. Intensive Reading (Deep / Analytical Reading)"],
          ["3. Intensive Reading (Deep / Analytical Reading) —"]
        ),
        listItem(
          "4. Extensive Reading (Reading for Fluency & Pleasure) — Reading longer texts fluently at a natural pace for overall pleasure, general knowledge, or broad language development, without pausing for every unknown word. It builds passive vocabulary, reading stamina, and cultural familiarity. Example: Reading novels, biographies, business magazines, or travelogues.",
          ["4. Extensive Reading (Reading for Fluency & Pleasure)"],
          ["4. Extensive Reading (Reading for Fluency & Pleasure) —"]
        )
      ], "decimal"),
      table(
        "Table: Comparison of the Four Types of Reading",
        ["Reading Type", "Reading Speed", "Objective / Focus", "Typical Material"],
        [
          ["Skimming", "Very Fast", "Gist, main themes, and general outline", "Newspapers, report previews"],
          ["Scanning", "Extremely Rapid", "Locating specific isolated facts/data", "Directories, schedules, indices"],
          ["Intensive Reading", "Slow & Deliberate", "Deep, detailed, analytical comprehension", "Contracts, case studies, textbooks"],
          ["Extensive Reading", "Moderate & Fluent", "General understanding, pleasure, fluency", "Novels, magazines, biographies"]
        ]
      )
    ]
  },
  {
    id: "eng-u3-q33",
    questionNumber: "Q.33",
    questionText: "What is writing? Explain the three types of writing: Formal, Informal, and Semi-formal.",
    marks: 7,
    unit: "Unit 3",
    type: "detail",
    answer: [
      heading("1. Definition of Writing"),
      p(
        "Writing is a productive, encoding communication skill through which ideas, thoughts, information, and feelings are organized and expressed systematically using conventional graphic symbols (letters and punctuation). In professional and communicative English, writing requires clear structure, appropriate tone, grammatical precision, and audience awareness.",
        ["Writing", "productive, encoding communication skill"]
      ),
      heading("2. The Three Types of Writing"),
      p(
        "Depending on the purpose, target audience, and degree of relationship between the writer and the reader, writing is categorized into three primary types:",
        ["three primary types"]
      ),
      list([
        listItem(
          "1. Formal Writing — Used for professional, academic, legal, and official communication where the relationship between writer and reader is impersonal or hierarchical. Characteristics: (a) Serious, polite, and objective tone. (b) Avoids contractions (uses 'do not' instead of 'don't'), slang, or colloquialisms. (c) Uses standard grammar, complete sentences, and formal vocabulary. (d) Follows strict layouts and prescribed formats. Examples: Official business letters, project proposals, academic research papers, legal agreements, official memos, and job application cover letters.",
          ["1. Formal Writing"],
          ["1. Formal Writing —"]
        ),
        listItem(
          "2. Informal Writing — Used for personal, casual, and social communication where there is a close, personal relationship between writer and reader (friends, family, or peers). Characteristics: (a) Conversational, emotional, and expressive tone. (b) Freely uses contractions (can't, won't), idioms, abbreviations, and colloquial expressions. (c) Sentence structures can be short, fragmented, or spontaneous. (d) Flexible format without rigid rules. Examples: Personal letters to relatives, friendly text messages, diary entries, personal postcards, and personal social media posts.",
          ["2. Informal Writing"],
          ["2. Informal Writing —"]
        ),
        listItem(
          "3. Semi-Formal Writing — Used in situations that require professional politeness and clarity, but where the writer shares a familiar, collegial, or collaborative working relationship with the reader. Characteristics: (a) Professional yet approachable and polite tone. (b) Measured use of contractions is acceptable, but slang is strictly avoided. (c) Well-structured paragraphs that are direct, concise, and courteous. Examples: Day-to-day emails to workplace colleagues, letters to a school committee, communication to club members, and polite customer inquiry replies.",
          ["3. Semi-Formal Writing"],
          ["3. Semi-Formal Writing —"]
        )
      ], "decimal"),
      table(
        "Table: Comparison of Formal, Informal, and Semi-Formal Writing",
        ["Parameter", "Formal Writing", "Informal Writing", "Semi-Formal Writing"],
        [
          ["Intended Audience", "Authorities, clients, professors, officials", "Friends, family members, close peers", "Colleagues, project teammates, acquaintances"],
          ["Tone & Style", "Objective, serious, respectful, impersonal", "Casual, warm, spontaneous, conversational", "Polite, respectful, approachable, business-casual"],
          ["Contractions & Slang", "Strictly prohibited (no 'can\\'t', 'won\\'t')", "Freely permitted (slang, idioms, emojis)", "Occasional contractions allowed; no slang"],
          ["Sentence Structure", "Complex, polished, passive voice common", "Short, simple, conversational, active", "Clear, concise, balanced, standard grammar"],
          ["Typical Examples", "Official reports, formal letters, resumes", "Personal notes, WhatsApp chats, diary entries", "Team emails, club notices, workplace updates"]
        ]
      )
    ]
  }
];

// Combine all questions
const allQuestions = [
  ...unit1Questions,
  ...unit2Questions,
  ...unit3Questions
];

const newGceData = {
  semester: 1,
  course: "Bachelor of Business Administration (BBA)",
  college: "Shree Swami Atmanand Saraswati Institute of Technology (SSASIT)",
  university: "Gujarat Technological University (GTU)",
  subject: "General and Communicative English",
  subjectCode: "GCE",
  faculty: [
    "Ms. Nisha Tollawala",
    "Prof. Hetal S. Ballar"
  ],
  header: {
    college: "Shree Swami Atmanand Saraswati Institute of Technology (SSASIT)",
    university: "Gujarat Technological University (GTU)",
    course: "Bachelor of Business Administration (BBA)",
    semester: 1,
    subject: "General and Communicative English",
    subjectCode: "GCE",
    faculty: [
      "Ms. Nisha Tollawala",
      "Prof. Hetal S. Ballar"
    ]
  },
  footer: {
    college: "SSASIT",
    university: "GTU",
    course: "BBA Sem-1",
    subject: "General and Communicative English",
    subjectCode: "GCE",
    faculty: [
      "Ms. Nisha Tollawala",
      "Prof. Hetal S. Ballar"
    ]
  },
  questions: allQuestions
};

// Verification: check all spans
let spanErrors = 0;
allQuestions.forEach(q => {
  q.answer.forEach((block, bIdx) => {
    if (block.text && block.spans) {
      block.spans.forEach(s => {
        if (s.start < 0 || s.end > block.text.length || s.start >= s.end) {
          console.error(`Span error in ${q.id} block ${bIdx}:`, s, `text len: ${block.text.length}`);
          spanErrors++;
        }
      });
    }
    if (block.items) {
      block.items.forEach((item, iIdx) => {
        if (item.spans) {
          item.spans.forEach(s => {
            if (s.start < 0 || s.end > item.text.length || s.start >= s.end) {
              console.error(`Span error in ${q.id} list item ${iIdx}:`, s, `text len: ${item.text.length}`);
              spanErrors++;
            }
          });
        }
      });
    }
  });
});

console.log(`Span errors found: ${spanErrors}`);
console.log(`Total questions: ${allQuestions.length}`);

// Write back to file
fs.writeFileSync(gcePath, JSON.stringify(newGceData, null, 2), 'utf8');
console.log(`Successfully written to ${gcePath}`);
