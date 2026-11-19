import { describe, it } from 'node:test'
import assert from 'node:assert'
import quizQuestions from '../../src/data/quiz.json' with { type: 'json' }
import {
  calculateQuizScore,
  evaluateQuizComparison,
  buildQuizAnalyticsPayload,
  shuffleQuestions
} from '../../src/utils/quizAnalytics.js'

describe('Quiz & Learning Layer (P2-01, P2-03, P2-04)', () => {
  it('P2-01: contains exactly 5 structured questions with source IDs, explanations, and single correct answer', () => {
    assert.strictEqual(quizQuestions.length, 5, 'Must contain exactly 5 canonical questions')
    for (const q of quizQuestions) {
      assert.ok(q.id, 'Question must have id')
      assert.ok(q.concept, 'Question must map to a concept')
      assert.ok(q.question, 'Question must have text')
      assert.ok(q.source, 'Question must have source ID')
      assert.ok(q.explanation, 'Question must have explanation')
      assert.ok(q.explanation.includes('(game estimate)'), 'Explanation must include (game estimate)')
      assert.ok(Array.isArray(q.options) && q.options.length >= 3, 'Must have at least 3 options')
      const correctOptions = q.options.filter((o) => o.isCorrect)
      assert.strictEqual(correctOptions.length, 1, 'Must have exactly 1 correct option')
    }
  })

  it('ITEM-4: identical 5 questions before and after, but order differs (question and option shuffling)', () => {
    const preQuestions = quizQuestions
    const postQuestions = shuffleQuestions(quizQuestions, 42)

    // Identical count
    assert.strictEqual(preQuestions.length, 5)
    assert.strictEqual(postQuestions.length, 5)

    // Identical question IDs
    const preIds = preQuestions.map((q) => q.id)
    const postIds = postQuestions.map((q) => q.id)
    assert.deepStrictEqual(new Set(preIds), new Set(postIds))

    // Question order must differ
    assert.notDeepStrictEqual(preIds, postIds, 'Question order in post-check must be shuffled')

    // Option order within at least one question must differ
    let optionOrderDiffered = false
    for (const qPost of postQuestions) {
      const qPre = preQuestions.find((q) => q.id === qPost.id)
      const preOptIds = qPre.options.map((o) => o.id)
      const postOptIds = qPost.options.map((o) => o.id)
      if (JSON.stringify(preOptIds) !== JSON.stringify(postOptIds)) {
        optionOrderDiffered = true
        break
      }
    }
    assert.ok(optionOrderDiffered, 'Option order within questions must be shuffled in post-check')
  })

  it('ITEM-4: score math is correct across varied response sets', () => {
    // 2 correct pre
    const preAnswers = {
      quiz_q1_soil_microbes: 'opt_b', // incorrect
      quiz_q2_happy_seeder: 'opt_b',  // correct
      quiz_q3_bio_decomposer: 'opt_a', // incorrect
      quiz_q4_pm25_health: 'opt_a',   // correct
      quiz_q5_biomass_economy: 'opt_c' // incorrect
    }

    // 5 correct post
    const postAnswers = {
      quiz_q1_soil_microbes: 'opt_a', // correct (learned!)
      quiz_q2_happy_seeder: 'opt_b',  // correct (known/retained)
      quiz_q3_bio_decomposer: 'opt_c', // correct (learned!)
      quiz_q4_pm25_health: 'opt_a',   // correct (known/retained)
      quiz_q5_biomass_economy: 'opt_b' // correct (learned!)
    }

    const evalResult = evaluateQuizComparison({
      preAnswers,
      postAnswers,
      questions: quizQuestions
    })

    assert.strictEqual(evalResult.preScore, 2)
    assert.strictEqual(evalResult.postScore, 5)
    assert.strictEqual(evalResult.delta, +3)
    assert.strictEqual(evalResult.improved, true)
    assert.strictEqual(evalResult.conceptsLearned.length, 3)
    assert.strictEqual(evalResult.conceptsKnown.length, 2)
    assert.strictEqual(evalResult.conceptsConfused.length, 0)
    assert.ok(evalResult.feedbackMessage.includes('+3 points'))
  })

  it('ITEM-4: results view renders honest non-blaming message on zero gain or drop', () => {
    // Pre: 3 correct
    const preAnswers = {
      quiz_q1_soil_microbes: 'opt_a', // correct
      quiz_q2_happy_seeder: 'opt_b',  // correct
      quiz_q4_pm25_health: 'opt_a'    // correct
    }
    // Post: 3 correct (same score, delta = 0)
    const postAnswersZeroGain = {
      quiz_q1_soil_microbes: 'opt_a', // correct
      quiz_q2_happy_seeder: 'opt_b',  // correct
      quiz_q4_pm25_health: 'opt_a'    // correct
    }

    const evalZero = evaluateQuizComparison({
      preAnswers,
      postAnswers: postAnswersZeroGain,
      questions: quizQuestions
    })

    assert.strictEqual(evalZero.delta, 0)
    assert.strictEqual(evalZero.improved, false)
    assert.strictEqual(
      evalZero.feedbackMessage,
      'Residue management concepts take time to master — review the season choices above.',
      'Must render exact non-blaming message on zero gain'
    )

    // Drop case (-1 delta)
    const postAnswersDrop = {
      quiz_q1_soil_microbes: 'opt_a',
      quiz_q2_happy_seeder: 'opt_b'
    }
    const evalDrop = evaluateQuizComparison({
      preAnswers,
      postAnswers: postAnswersDrop,
      questions: quizQuestions
    })
    assert.strictEqual(evalDrop.delta, -1)
    assert.strictEqual(evalDrop.improved, false)
    assert.strictEqual(
      evalDrop.feedbackMessage,
      'Residue management concepts take time to master — review the season choices above.'
    )
    assert.ok(evalDrop.conceptsConfused.length > 0)
  })

  it('ITEM-4: skip is logged in anonymous learning analytics payload', () => {
    const payload = buildQuizAnalyticsPayload({
      sessionId: 'test_session_skip_99',
      classCode: 'PUNJAB9',
      preSession: { answers: {}, durationMs: 2500, skipped: true },
      postSession: { answers: { quiz_q1_soil_microbes: 'opt_a' }, durationMs: 8000, skipped: false },
      questions: quizQuestions
    })

    assert.strictEqual(payload.sessionId, 'test_session_skip_99')
    assert.strictEqual(payload.classCode, 'PUNJAB9')
    assert.strictEqual(payload.preCheck.skipped, true, 'Pre-check skip must be logged as true')
    assert.strictEqual(payload.preCheck.score, 0)
    assert.strictEqual(payload.postCheck.skipped, false)
    assert.strictEqual(payload.postCheck.score, 1)
    assert.strictEqual(payload.delta, 1)
    assert.strictEqual(payload.status, 'complete')
  })
})
