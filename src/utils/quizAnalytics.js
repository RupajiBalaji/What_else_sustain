/**
 * quizAnalytics.js
 * Manages quiz session state, scoring, delta comparison, and analytics payloads.
 */

export function calculateQuizScore(answers, questions) {
  if (!answers || typeof answers !== 'object' || !Array.isArray(questions)) return 0
  let correctCount = 0
  for (const q of questions) {
    const selectedOptionId = answers[q.id]
    const correctOption = q.options?.find((opt) => opt.isCorrect)
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
  const conceptsKnown = []
  const conceptsConfused = []

  for (const q of effectivePostQ) {
    const correctOption = q.options?.find((opt) => opt.isCorrect)
    const wasPreCorrect = preAnswers[q.id] === correctOption?.id
    const wasPostCorrect = postAnswers[q.id] === correctOption?.id

    const item = {
      id: q.id,
      concept: q.concept,
      explanation: q.explanation
    }

    if (!wasPreCorrect && wasPostCorrect) {
      conceptsLearned.push(item)
    } else if (wasPreCorrect && wasPostCorrect) {
      conceptsKnown.push(item)
    } else if (!wasPostCorrect) {
      conceptsConfused.push(item)
    }
  }

  const feedbackMessage = delta > 0
    ? `Strong progress: +${delta} points gained after exploring real field consequences.`
    : 'Residue management concepts take time to master — review the season choices above.'

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
    conceptsKnown,
    conceptsConfused,
    conceptsNeedsReview: conceptsConfused, // Backwards compatibility alias
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
    conceptsKnown: evaluation.conceptsKnown.map((c) => c.concept),
    conceptsConfused: evaluation.conceptsConfused.map((c) => c.concept),
    status: 'complete'
  }
}

function mulberry32(a) {
  let s = a >>> 0
  return function () {
    let t = (s += 0x6D2B79F5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleArray(arr, seed = null) {
  const result = [...arr]
  if (result.length <= 1) return result
  const rng = seed !== null ? mulberry32(seed) : Math.random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  // Guarantee shuffled order differs from original
  if (result.every((item, idx) => (item.id || item) === (arr[idx].id || arr[idx]))) {
    result.push(result.shift())
  }
  return result
}

/**
 * Shuffles question order and option order while preserving question IDs and option structure
 */
export function shuffleQuestions(questions, seed = null) {
  if (!Array.isArray(questions)) return []
  const shuffledQ = shuffleArray(questions, seed)
  return shuffledQ.map((q, idx) => ({
    ...q,
    options: shuffleArray(q.options || [], seed !== null ? seed + (idx + 1) * 37 : null)
  }))
}
