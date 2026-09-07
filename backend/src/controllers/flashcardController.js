const Flashcard = require('../models/Flashcard')

exports.toggleFlashcard = async (req, res) => {
  try {
    const { mcqId, subject, chapterId } = req.body
    
    const existing = await Flashcard.findOne({ studentId: req.user.id, mcqId })
    
    if (existing) {
      await Flashcard.findByIdAndDelete(existing._id)
      return res.status(200).json({ success: true, message: 'Removed from flashcards', saved: false })
    }

    const flashcard = await Flashcard.create({
      studentId: req.user.id,
      mcqId,
      subject,
      chapterId
    })

    res.status(201).json({ success: true, message: 'Added to flashcards', saved: true, flashcard })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getDueFlashcards = async (req, res) => {
  try {
    const subject = req.query.subject
    const query = {
      studentId: req.user.id,
      nextReviewDate: { $lte: new Date() }
    }
    
    if (subject) query.subject = subject

    const flashcards = await Flashcard.find(query)
      .populate('mcqId')
      .sort({ nextReviewDate: 1 })
      .limit(50)

    res.status(200).json({ success: true, count: flashcards.length, flashcards })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getFlashcardStats = async (req, res) => {
    try {
        const total = await Flashcard.countDocuments({ studentId: req.user.id })
        const due = await Flashcard.countDocuments({ studentId: req.user.id, nextReviewDate: { $lte: new Date() } })
        res.status(200).json({ success: true, total, due })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

exports.reviewFlashcard = async (req, res) => {
  try {
    const { quality } = req.body
    const flashcard = await Flashcard.findOne({ _id: req.params.id, studentId: req.user.id })

    if (!flashcard) return res.status(404).json({ error: 'Flashcard not found' })

    let easeFactor = flashcard.easeFactor
    let interval = flashcard.interval
    let repetitions = flashcard.repetitions

    if (quality >= 3) {
      if (repetitions === 0) interval = 1
      else if (repetitions === 1) interval = 6
      else interval = Math.round(interval * easeFactor)
      repetitions++
    } else {
      repetitions = 0
      interval = 1
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (easeFactor < 1.3) easeFactor = 1.3

    flashcard.easeFactor = easeFactor
    flashcard.interval = interval
    flashcard.repetitions = repetitions
    
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)
    flashcard.nextReviewDate = nextReview

    await flashcard.save()
    res.status(200).json({ success: true, flashcard })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getSavedStatus = async (req, res) => {
  try {
    const { mcqIds } = req.body;
    if (!Array.isArray(mcqIds) || mcqIds.length === 0) {
      return res.status(200).json({ success: true, savedStatus: {} });
    }
    const flashcards = await Flashcard.find({
      studentId: req.user.id,
      mcqId: { $in: mcqIds }
    }).select('mcqId');
    
    const savedStatus = {};
    flashcards.forEach(fc => { savedStatus[fc.mcqId] = true; });
    res.status(200).json({ success: true, savedStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
