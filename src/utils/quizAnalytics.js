/**
 * quizAnalytics.js
 * Manages quiz session state, scoring, delta comparison, and analytics payloads.
 */

export function calculateQuizScore(answers, questions) {
  if (!answers || typeof answers !== 'object' || !Array.isArray(questions)) return 0
  let correctCount = 0
  for (const q of questions) {
    const selectedOptionId = answers[q.id]
    const correctOption = q.options.find((opt) => opt.isCorrect)
    if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
      correctCount++
    }
  }
  return correctCount
}

export function evaluateQuizComparison({ preAnswers = {}, postAnswers = {}, questions = [], preQuestions = null, postQuestions = null }) {
  const effectivePreQ = preQuestions || questions
  const effectivePostQ = postQuestions || questions

  const preScore = calculateQuizScore(preAnswers, effectivePreQ)
  const postScore = calculateQuizScore(postAnswers, effectivePostQ)
  const preTotal = effectivePreQ.length || 1
  const postTotal = effectivePostQ.length || 1

  const prePct = Math.round((preScore / preTotal) * 100)
  const postPct = Math.round((postScore / postTotal) * 100)
  const delta = postScore - preScore
  const improvementScore = postPct - prePct

  const conceptsLearned = []
  const conceptsNeedsReview = []

  for (const q of effectivePostQ) {
    const correctOption = q.options.find((opt) => opt.isCorrect)
    const wasPreCorrect = preAnswers[q.id] === correctOption?.id
    const wasPostCorrect = postAnswers[q.id] === correctOption?.id

    if (!wasPreCorrect && wasPostCorrect) {
      conceptsLearned.push({
        id: q.id,
        concept: q.concept,
        explanation: q.explanation
      })
    } else if (!wasPostCorrect) {
      conceptsNeedsReview.push({
        id: q.id,
        concept: q.concept,
        explanation: q.explanation
      })
    }
  }

  const feedbackMessage = delta > 0
    ? `Strong progress: +${delta} points gained after exploring real field consequences.`
    : delta === 0
      ? 'Consistent understanding across rounds. Try the side-by-side comparison again for deeper insights.'
      : 'Nothing wrong here, try the comparison again to see how alternatives protect soil biology and village air.'

  return {
    preScore,
    preTotal,
    postScore,
    postTotal,
    prePct,
    postPct,
    improvementScore,
    totalQuestions: questions.length,
    delta,
    improved: delta > 0,
    conceptsLearned,
    conceptsNeedsReview,
    feedbackMessage
  }
}

export function buildQuizAnalyticsPayload({
  sessionId,
  classCode = null,
  preSession = null,
  postSession = null,
  questions = []
}) {
  const preAnswers = preSession?.answers || {}
  const postAnswers = postSession?.answers || {}
  const evaluation = evaluateQuizComparison({ preAnswers, postAnswers, questions })

  return {
    sessionId: sessionId || `wes_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    classCode: classCode || null,
    timestamp: new Date().toISOString(),
    preCheck: {
      score: evaluation.preScore,
      total: questions.length,
      durationMs: preSession?.durationMs || 0,
      skipped: Boolean(preSession?.skipped)
    },
    postCheck: {
      score: evaluation.postScore,
      total: questions.length,
      durationMs: postSession?.durationMs || 0,
      skipped: Boolean(postSession?.skipped)
    },
    delta: evaluation.delta,
    conceptsLearned: evaluation.conceptsLearned.map((c) => c.concept),
    status: 'complete'
  }
}

/**
 * Deterministically or randomly shuffle questions without mutating original array
 */
export function shuffleQuestions(questions, seed = null) {
  const arr = [...questions]
  if (seed !== null) {
    // Deterministic pseudo-random shuffle
    let s = seed
    for (let i = arr.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280
      const j = Math.floor((s / 233280) * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
  } else {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
  }
  return arr
}
