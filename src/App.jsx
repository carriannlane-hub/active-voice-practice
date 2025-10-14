import React, { useState, useEffect, useRef } from 'react';

const ActiveVoiceGame = () => {
  const sentences = [
    {
      original: "The decision was made by the committee to implement the new policy.",
      passive: "was made by",
      verbs: "made (nominalized as 'decision'), implement",
      active: "The committee decided to implement the new policy.",
      hint: "Look for who makes the decision. That person or group should come first. The word 'decision' is hiding an action verb - can you find it?",
      acceptableAnswers: [
        "the committee decided to implement the new policy",
        "the committee made the decision to implement the new policy"
      ]
    },
    {
      original: "An investigation of the matter will be conducted by the team.",
      passive: "will be conducted by",
      verbs: "conducted (nominalized as 'investigation')",
      active: "The team will investigate the matter.",
      hint: "Who will do the investigating? Put them first. Notice how 'investigation' is a noun - can you turn it back into an action verb?",
      acceptableAnswers: [
        "the team will investigate the matter",
        "the team will conduct an investigation of the matter"
      ]
    },
    {
      original: "The report was written by the analyst and submitted for review.",
      passive: "was written by, submitted for",
      verbs: "written, submitted",
      active: "The analyst wrote the report and submitted it for review.",
      hint: "Who wrote the report? Start with that person. This sentence has two actions - who performs both of them?",
      acceptableAnswers: [
        "the analyst wrote the report and submitted it for review",
        "the analyst wrote and submitted the report for review"
      ]
    },
    {
      original: "A discussion of the results was held by the scientists.",
      passive: "was held by",
      verbs: "held (nominalized as 'discussion')",
      active: "The scientists discussed the results.",
      hint: "Who held the discussion? They should come first. Can you convert 'discussion' from a noun back into a verb?",
      acceptableAnswers: [
        "the scientists discussed the results",
        "the scientists held a discussion of the results"
      ]
    }
  ];

  const [currentSentence, setCurrentSentence] = useState(0);
  const [step, setStep] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  const feedbackRef = useRef(null);
  const nextButtonRef = useRef(null);
  const mainContentRef = useRef(null);
  const answerInputRef = useRef(null);

  useEffect(() => {
    if (step === 0) {
      setAnnouncement(`Sentence ${currentSentence + 1} of ${sentences.length}. Step 1: Identify the passive phrase.`);
    } else if (step === 1) {
      setAnnouncement('Step 2: Identify the verbs that can be activated.');
    } else if (step === 2) {
      setAnnouncement('Step 3: Rewrite the sentence in active voice. You can now type your answer.');
      setTimeout(() => {
        if (answerInputRef.current) {
          answerInputRef.current.focus();
        }
      }, 100);
    }
  }, [step, currentSentence]);

  useEffect(() => {
    if (feedback && feedbackRef.current) {
      feedbackRef.current.focus();
    }
  }, [feedback]);

  const normalizeAnswer = (text) => {
    return text.toLowerCase().trim().replace(/[.,!?]/g, '');
  };

  const getEditDistance = (str1, str2) => {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[len1][len2];
  };

  const isSimilar = (word1, word2, maxDistance = 2) => {
    if (word1 === word2) return true;
    if (Math.abs(word1.length - word2.length) > maxDistance) return false;
    return getEditDistance(word1, word2) <= maxDistance;
  };

  const containsSimilarWord = (text, targetWords, maxDistance = 2) => {
    const textWords = text.split(/\s+/);
    return targetWords.some(target => 
      textWords.some(word => isSimilar(word, target, maxDistance))
    );
  };

  const startsWithSimilar = (text, targetStarts, maxDistance = 2) => {
    const firstWords = text.split(/\s+/).slice(0, 2).join(' ');
    return targetStarts.some(target => {
      const targetWords = target.split(/\s+/);
      const userWords = firstWords.split(/\s+/).slice(0, targetWords.length);
      
      if (targetWords.length !== userWords.length) return false;
      
      return targetWords.every((targetWord, idx) => 
        isSimilar(userWords[idx], targetWord, maxDistance)
      );
    });
  };

  const validateActiveVoice = (userText, sentenceIndex) => {
    const normalized = normalizeAnswer(userText);
    
    const exactMatch = sentences[sentenceIndex].acceptableAnswers.some(
      answer => normalizeAnswer(answer) === normalized
    );
    if (exactMatch) {
      return { isCorrect: true, message: 'perfect' };
    }

    const validationRules = [
      {
        mustStartWith: ['committee', 'the committee'],
        activeVerbs: ['decided', 'decide', 'made', 'make', 'chose', 'choose', 'elected', 'elect'],
        bannedPhrases: ['was made', 'is made', 'were made', 'has been made'],
        checkPassiveBy: true
      },
      {
        mustStartWith: ['team', 'the team'],
        activeVerbs: ['investigate', 'investigated', 'will investigate', 'examine', 'examined', 'will examine', 'conduct', 'conducted', 'will conduct', 'look into', 'will look into', 'review', 'will review', 'study', 'will study'],
        bannedPhrases: ['will be conducted', 'be conducted', 'is conducted', 'was conducted'],
        checkPassiveBy: true
      },
      {
        mustStartWith: ['analyst', 'the analyst'],
        activeVerbs: ['wrote', 'write', 'prepared', 'prepare', 'created', 'create', 'drafted', 'draft', 'composed', 'compose'],
        bannedPhrases: ['was written', 'is written', 'were written', 'has been written'],
        checkPassiveBy: true
      },
      {
        mustStartWith: ['scientists', 'the scientists'],
        activeVerbs: ['discussed', 'discuss', 'talked about', 'talk about', 'reviewed', 'review', 'analyzed', 'analyze', 'examined', 'examine', 'debated', 'debate'],
        bannedPhrases: ['was held', 'is held', 'were held', 'has been held'],
        checkPassiveBy: true
      }
    ];

    const rules = validationRules[sentenceIndex];
    
    const startsCorrectly = startsWithSimilar(normalized, rules.mustStartWith);
    
    if (!startsCorrectly) {
      return { 
        isCorrect: false, 
        feedback: 'specific',
        message: 'Remember to start your sentence with the subject - the person or thing doing the action. Who performs the action in this sentence?' 
      };
    }

    const hasPassive = rules.bannedPhrases.some(phrase => 
      normalized.includes(phrase)
    );
    
    if (hasPassive) {
      return { 
        isCorrect: false, 
        feedback: 'specific',
        message: 'Your sentence still contains passive voice. Try removing phrases like "was" or "were" and use a direct action verb instead.' 
      };
    }

    if (rules.checkPassiveBy && normalized.includes('by the')) {
      return { 
        isCorrect: false, 
        feedback: 'specific',
        message: 'Your sentence still contains passive voice. Try removing "by the" and restructure with an active verb.' 
      };
    }

    const hasActiveVerb = containsSimilarWord(normalized, rules.activeVerbs);
    
    if (!hasActiveVerb) {
      return { 
        isCorrect: false, 
        feedback: 'specific',
        message: 'Check your verb choice. Make sure you are using a strong, active verb that shows clear action.' 
      };
    }

    return { isCorrect: true, message: 'validated' };
  };

  const handleReveal = () => {
    setStep(step + 1);
    setShowHint(false);
  };

  const handleSubmitAnswer = () => {
    const validation = validateActiveVoice(userAnswer, currentSentence);

    if (validation.isCorrect) {
      setFeedback('Excellent work! You successfully converted the sentence to active voice. The subject is now before the verb, making the sentence clearer and more direct.');
      setShowAnswer(true);
      setAnnouncement('Correct answer! Moving to next sentence button.');
      setTimeout(() => {
        if (nextButtonRef.current) {
          nextButtonRef.current.focus();
        }
      }, 100);
    } else {
      if (attempts === 0) {
        const hintMessage = validation.feedback === 'specific' 
          ? validation.message 
          : 'Not quite! Here is a hint: Make sure the person or thing doing the action comes first in your sentence. Check that you have placed the subject before the verb. You have one more try.';
        setFeedback(hintMessage);
        setAttempts(1);
        setAnnouncement('Answer incorrect. Hint provided. Try again.');
      } else {
        setFeedback(`Let's look at one correct answer: ${sentences[currentSentence].active}. Notice how the subject comes first, followed by a strong action verb. Your answer was also on the right track!`);
        setShowAnswer(true);
        setAnnouncement('Second attempt incorrect. Example answer revealed. Moving to next sentence button.');
        setTimeout(() => {
          if (nextButtonRef.current) {
            nextButtonRef.current.focus();
          }
        }, 100);
      }
    }
  };

  const handleNextSentence = () => {
    if (currentSentence < sentences.length - 1) {
      setCurrentSentence(currentSentence + 1);
      setStep(0);
      setUserAnswer('');
      setFeedback('');
      setAttempts(0);
      setShowAnswer(false);
      setShowHint(false);
      setTimeout(() => {
        if (mainContentRef.current) {
          mainContentRef.current.focus();
        }
      }, 100);
    }
  };

  const handleReset = () => {
    setCurrentSentence(0);
    setStep(0);
    setUserAnswer('');
    setFeedback('');
    setAttempts(0);
    setShowAnswer(false);
    setShowHint(false);
    setAnnouncement('Game reset. Starting from sentence 1.');
    setTimeout(() => {
      if (mainContentRef.current) {
        mainContentRef.current.focus();
      }
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && step === 2 && !showAnswer && userAnswer.trim()) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const skipToMain = (e) => {
    e.preventDefault();
    if (mainContentRef.current) {
      mainContentRef.current.focus();
      mainContentRef.current.scrollIntoView();
    }
  };

  const fontSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  const headingFontSizes = {
    small: { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg' },
    medium: { h1: 'text-4xl', h2: 'text-2xl', h3: 'text-xl' },
    large: { h1: 'text-5xl', h2: 'text-3xl', h3: 'text-2xl' }
  };

  const bgColors = highContrast 
    ? 'bg-black text-white' 
    : 'bg-gradient-to-br from-blue-50 to-indigo-50';
  
  const cardColors = highContrast 
    ? 'bg-gray-900 border-4 border-white' 
    : 'bg-white';
  
  const buttonColors = highContrast
    ? 'bg-yellow-400 text-black border-4 border-white hover:bg-yellow-300'
    : 'bg-indigo-600 text-white hover:bg-indigo-700';

  const successColors = highContrast
    ? 'bg-black border-4 border-green-400 text-green-400'
    : 'bg-green-100 border-2 border-green-400 text-green-900';

  const warningColors = highContrast
    ? 'bg-black border-4 border-yellow-400 text-yellow-400'
    : 'bg-orange-100 border-2 border-orange-400 text-orange-900';

  const infoColors = highContrast
    ? 'bg-black border-4 border-blue-400 text-blue-400'
    : 'bg-blue-100 border-2 border-blue-400 text-blue-900';

  return (
    <div lang="en" className={`min-h-screen p-8 ${bgColors} ${fontSizeClasses[fontSize]}`}>
      <a
        href="#main-content"
        onClick={skipToMain}
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-indigo-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-4 focus:ring-indigo-300 z-50"
      >
        Skip to main content
      </a>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className={`${headingFontSizes[fontSize].h1} font-bold ${highContrast ? 'text-white' : 'text-indigo-900'} mb-4`}>
            Active Voice Practice Game
          </h1>
          <p className={`${highContrast ? 'text-gray-200' : 'text-gray-700'} mb-4`}>
            Learn to transform passive voice and nominalizations into clear, active writing
          </p>

          <div className={`mt-6 p-4 rounded-lg ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white border-2 border-indigo-200'}`}>
            <h2 className={`${headingFontSizes[fontSize].h3} font-semibold mb-3`}>
              Display Settings
            </h2>
            
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex flex-col items-center">
                <label className="font-semibold mb-2">Contrast:</label>
                <button
                  onClick={() => setHighContrast(!highContrast)}
                  className={`px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                    highContrast 
                      ? 'bg-yellow-400 text-black border-2 border-white' 
                      : 'bg-gray-200 text-gray-800 border-2 border-gray-400'
                  }`}
                  aria-pressed={highContrast}
                  aria-label={`High contrast mode ${highContrast ? 'on' : 'off'}`}
                >
                  {highContrast ? 'High Contrast: ON' : 'High Contrast: OFF'}
                </button>
              </div>

              <div className="flex flex-col items-center">
                <label className="font-semibold mb-2">Text Size:</label>
                <div className="flex gap-2" role="group" aria-label="Font size controls">
                  <button
                    onClick={() => setFontSize('small')}
                    className={`px-3 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                      fontSize === 'small' 
                        ? (highContrast ? 'bg-yellow-400 text-black border-2 border-white' : 'bg-indigo-600 text-white')
                        : (highContrast ? 'bg-gray-800 text-white border-2 border-gray-600' : 'bg-gray-200 text-gray-800')
                    }`}
                    aria-pressed={fontSize === 'small'}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => setFontSize('medium')}
                    className={`px-3 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                      fontSize === 'medium' 
                        ? (highContrast ? 'bg-yellow-400 text-black border-2 border-white' : 'bg-indigo-600 text-white')
                        : (highContrast ? 'bg-gray-800 text-white border-2 border-gray-600' : 'bg-gray-200 text-gray-800')
                    }`}
                    aria-pressed={fontSize === 'medium'}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-3 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                      fontSize === 'large' 
                        ? (highContrast ? 'bg-yellow-400 text-black border-2 border-white' : 'bg-indigo-600 text-white')
                        : (highContrast ? 'bg-gray-800 text-white border-2 border-gray-600' : 'bg-gray-200 text-gray-800')
                    }`}
                    aria-pressed={fontSize === 'large'}
                  >
                    Large
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`mt-4 p-4 rounded-lg ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-white border-2 border-indigo-200'}`}>
            <p className="font-semibold mb-2">Keyboard Instructions:</p>
            <ul className="text-left list-disc list-inside space-y-1">
              <li>Use Tab to navigate between elements</li>
              <li>Press Enter to activate buttons</li>
              <li>Press Enter in the text area to submit your answer</li>
              <li>Use arrow keys within text areas to edit</li>
            </ul>
          </div>
        </header>

        <main 
          id="main-content"
          ref={mainContentRef}
          tabIndex="-1"
          className={`${cardColors} rounded-lg shadow-lg p-8 mb-6 focus:outline-none focus:ring-4 focus:ring-indigo-300`}
        >
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className={`${headingFontSizes[fontSize].h2} font-semibold ${highContrast ? 'text-white' : 'text-indigo-900'}`}>
                Sentence {currentSentence + 1} of {sentences.length}
              </h2>
              <div 
                className={`px-3 py-1 rounded ${highContrast ? 'bg-gray-800 text-white border-2 border-white' : 'bg-indigo-50 text-gray-600'}`}
                role="status"
                aria-label={`Currently on step ${step + 1} of 3`}
              >
                Step {step + 1} of 3
              </div>
            </div>

            <div className={`p-6 rounded-lg mb-6 ${highContrast ? 'bg-gray-800 border-2 border-white' : 'bg-gray-50 border-2 border-gray-200'}`}>
              <h3 className={`font-semibold mb-2 ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                Original Sentence:
              </h3>
              <p className={`leading-relaxed ${highContrast ? 'text-white' : 'text-gray-800'}`}>
                {sentences[currentSentence].original}
              </p>
            </div>

            {step === 0 && (
              <section aria-labelledby="step1-heading">
                <h3 id="step1-heading" className={`${headingFontSizes[fontSize].h3} font-semibold mb-4 ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                  Step 1: Identify the Passive Phrase
                </h3>
                <p className={`mb-4 ${highContrast ? 'text-gray-200' : 'text-gray-700'}`}>
                  In this step, you will discover which words create the passive voice. 
                  Look for phrases like "was done by" or "will be conducted by."
                </p>
                
                <button
                  onClick={() => setShowHint(!showHint)}
                  className={`mb-4 px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                    highContrast 
                      ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-2 border-gray-400'
                  }`}
                  aria-expanded={showHint}
                >
                  {showHint ? '✓ Hint (visible below)' : '💡 Need a Hint?'}
                </button>

                {showHint && (
                  <div className={`mb-4 p-4 rounded-lg ${highContrast ? 'bg-gray-800 border-2 border-yellow-400 text-yellow-400' : 'bg-blue-50 border-2 border-blue-300 text-blue-900'}`} role="region" aria-live="polite">
                    <p className="font-semibold mb-1">💡 Hint:</p>
                    <p>{sentences[currentSentence].hint}</p>
                  </div>
                )}

                <button
                  onClick={handleReveal}
                  className={`${buttonColors} px-6 py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transition font-semibold`}
                  aria-describedby="step1-heading"
                >
                  Show Me the Passive Phrase
                </button>
              </section>
            )}

            {step === 1 && (
              <section aria-labelledby="step1-result">
                <h3 id="step1-result" className={`${headingFontSizes[fontSize].h3} font-semibold mb-4 ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                  Step 1 Complete: Passive Phrase
                </h3>
                <div className={`p-4 rounded-lg mb-6 ${highContrast ? 'bg-gray-800 border-2 border-yellow-400 text-yellow-400' : 'bg-yellow-50 border-2 border-yellow-200 text-gray-800'}`}>
                  <p>
                    <span className="font-semibold">✓ Passive phrase found:</span> {sentences[currentSentence].passive}
                  </p>
                  <p className={`mt-2 ${highContrast ? 'text-yellow-300' : 'text-gray-700'}`}>
                    This phrase signals that the sentence is in passive voice.
                  </p>
                </div>
                <h3 className={`${headingFontSizes[fontSize].h3} font-semibold mb-4 ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                  Step 2: Identify the Verbs
                </h3>
                <p className={`mb-4 ${highContrast ? 'text-gray-200' : 'text-gray-700'}`}>
                  Now let us find the verbs that can be activated. Some may be hidden as nouns (nominalizations).
                </p>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className={`mb-4 px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                    highContrast 
                      ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-2 border-gray-400'
                  }`}
                  aria-expanded={showHint}
                >
                  {showHint ? '✓ Hint (visible below)' : '💡 Need a Hint?'}
                </button>

                {showHint && (
                  <div className={`mb-4 p-4 rounded-lg ${highContrast ? 'bg-gray-800 border-2 border-yellow-400 text-yellow-400' : 'bg-blue-50 border-2 border-blue-300 text-blue-900'}`} role="region" aria-live="polite">
                    <p className="font-semibold mb-1">💡 Hint:</p>
                    <p>{sentences[currentSentence].hint}</p>
                  </div>
                )}

                <button
                  onClick={handleReveal}
                  className={`${buttonColors} px-6 py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transition font-semibold`}
                >
                  Show Me the Verbs to Activate
                </button>
              </section>
            )}

            {step >= 2 && (
              <section aria-labelledby="step2-result">
                <h3 id="step2-result" className={`${headingFontSizes[fontSize].h3} font-semibold mb-4 ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                  Step 2 Complete: Verbs Identified
                </h3>
                <div className={`p-4 rounded-lg mb-6 ${highContrast ? 'bg-gray-800 border-2 border-green-400 text-green-400' : 'bg-green-50 border-2 border-green-200 text-gray-800'}`}>
                  <p>
                    <span className="font-semibold">✓ Verbs to activate:</span> {sentences[currentSentence].verbs}
                  </p>
                  <p className={`mt-2 ${highContrast ? 'text-green-300' : 'text-gray-700'}`}>
                    Use these as active verbs in your rewritten sentence.
                  </p>
                </div>
                <h3 className={`${headingFontSizes[fontSize].h3} font-semibold mb-4 ${highContrast ? 'text-white' : 'text-indigo-800'}`}>
                  Step 3: Rewrite in Active Voice
                </h3>
                <p className={`mb-4 ${highContrast ? 'text-gray-200' : 'text-gray-700'}`}>
                  Now it is your turn! Rewrite the sentence so the subject (who does the action) comes first, 
                  followed by an active verb. Make it clear and direct.
                </p>

                {!showAnswer && (
                  <>
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className={`mb-4 px-4 py-2 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-300 ${
                        highContrast 
                          ? 'bg-gray-800 text-white border-2 border-white hover:bg-gray-700' 
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300 border-2 border-gray-400'
                      }`}
                      aria-expanded={showHint}
                    >
                      {showHint ? '✓ Hint (visible below)' : '💡 Need a Hint?'}
                    </button>

                    {showHint && (
                      <div className={`mb-4 p-4 rounded-lg ${highContrast ? 'bg-gray-800 border-2 border-yellow-400 text-yellow-400' : 'bg-blue-50 border-2 border-blue-300 text-blue-900'}`} role="region" aria-live="polite">
                        <p className="font-semibold mb-1">💡 Hint:</p>
                        <p>{sentences[currentSentence].hint}</p>
                      </div>
                    )}
                  </>
                )}

                <label htmlFor="answer-input" className={`block font-semibold mb-2 ${highContrast ? 'text-white' : 'text-gray-700'}`}>
                  Your Active Voice Sentence:
                </label>
                <textarea
                  ref={answerInputRef}
                  id="answer-input"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={showAnswer}
                  className={`w-full p-4 rounded-lg mb-4 focus:outline-none focus:ring-4 focus:ring-indigo-300 disabled:cursor-not-allowed ${
                    highContrast 
                      ? 'bg-gray-800 text-white border-2 border-white disabled:bg-gray-900 disabled:border-gray-600' 
                      : 'border-2 border-gray-300 disabled:bg-gray-100'
                  }`}
                  rows="3"
                  placeholder="Type your answer here..."
                  aria-describedby="answer-instructions"
                  aria-required="true"
                />
                <p id="answer-instructions" className={`mb-4 ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
                  Press Enter or click the Submit button when you are ready. You will get feedback on your answer.
                </p>
                
                {!showAnswer && (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!userAnswer.trim()}
                    className={`px-6 py-3 rounded-lg font-semibold focus:outline-none focus:ring-4 focus:ring-green-300 transition disabled:cursor-not-allowed ${
                      highContrast 
                        ? 'bg-green-400 text-black border-2 border-white hover:bg-green-300 disabled:bg-gray-700 disabled:text-gray-500 disabled:border-gray-600' 
                        : 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400'
                    }`}
                    aria-describedby="answer-instructions"
                  >
                    Submit My Answer
                  </button>
                )}
              </section>
            )}

            {feedback && (
              <div
                ref={feedbackRef}
                role="status"
                aria-live="assertive"
                aria-atomic="true"
                tabIndex="-1"
                className={`mt-6 p-5 rounded-lg focus:outline-none ${
                  feedback.includes('Excellent')
                    ? successColors
                    : feedback.includes('Not quite')
                    ? warningColors
                    : infoColors
                }`}
              >
                <h4 className="font-bold mb-2">
                  {feedback.includes('Excellent') ? '✓ Correct!' : 
                   feedback.includes('Not quite') ? '⚠ Try Again' : 'ℹ Answer Revealed'}
                </h4>
                <p className="leading-relaxed">{feedback}</p>
              </div>
            )}

            {showAnswer && currentSentence < sentences.length - 1 && (
              <button
                ref={nextButtonRef}
                onClick={handleNextSentence}
                className={`mt-6 ${buttonColors} px-6 py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transition font-semibold`}
                aria-label={`Move to sentence ${currentSentence + 2} of ${sentences.length}`}
              >
                Continue to Next Sentence →
              </button>
            )}

            {showAnswer && currentSentence === sentences.length - 1 && (
              <div className={`mt-6 p-6 rounded-lg ${highContrast ? 'bg-gray-800 border-4 border-green-400' : 'bg-green-50 border-2 border-green-400'}`}>
                <h3 className={`font-bold mb-3 ${headingFontSizes[fontSize].h2} ${highContrast ? 'text-green-400' : 'text-green-800'}`}>
                  🎉 Congratulations!
                </h3>
                <p className={`mb-4 ${highContrast ? 'text-white' : 'text-gray-800'}`}>
                  You have completed all {sentences.length} sentences. You are now better equipped to write in active voice!
                </p>
                <button
                  onClick={handleReset}
                  className={`${buttonColors} px-6 py-3 rounded-lg focus:outline-none focus:ring-4 focus:ring-indigo-300 transition font-semibold`}
                  aria-label="Restart the game from sentence 1"
                >
                  Start Over
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className={`rounded-lg p-6 ${highContrast ? 'bg-gray-900 border-2 border-white' : 'bg-indigo-100'}`} aria-labelledby="tips-heading">
          <h2 id="tips-heading" className={`font-semibold mb-3 ${headingFontSizes[fontSize].h3} ${highContrast ? 'text-white' : 'text-indigo-900'}`}>
            Quick Tips for Active Voice:
          </h2>
          <ul className={`list-disc list-inside space-y-2 ${highContrast ? 'text-gray-200' : 'text-gray-700'}`}>
            <li>Ask yourself: <strong>Who or what does the action?</strong> Put that first.</li>
            <li>Look for passive linking verbs like "was," "were," "is," or "been"</li>
            <li>Use strong, specific action verbs instead of weak passive constructions</li>
            <li>Convert nominalizations (noun forms of verbs) back to active verbs</li>
            <li>Make the subject the "doer" of the action, not the receiver</li>
          </ul>
        </aside>

        <footer className={`mt-8 text-center ${highContrast ? 'text-gray-300' : 'text-gray-600'}`}>
          <p>© Sentient Learning 2025. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ActiveVoiceGame;
