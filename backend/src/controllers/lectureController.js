const Lecture = require('../models/Lecture')
const Course = require('../models/Course')

// ==================== CREATE LECTURE ====================
exports.createLecture = async (req, res) => {
  try {
    const {
      title,
      description,
      courseId,
      topic,
      videoUrl,
      videoDuration,
      notes,
      isPublished,
      attachments,
    } = req.body

    if (!title || !description || !courseId || !topic || !videoUrl) {
      return res
        .status(400)
        .json({ error: 'Please provide all required fields' })
    }

    // Check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }

    // Check if user is creator of course or admin
    if (
      course.createdBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to add lectures to this course' })
    }

    const lecture = await Lecture.create({
      title,
      description,
      courseId,
      topic,
      videoUrl,
      videoDuration: videoDuration || 0,
      notes: notes || null,
      attachments: Array.isArray(attachments) ? attachments : [],
      uploadedBy: req.user.id,
      isPublished: typeof isPublished === 'boolean' ? isPublished : false,
    })

    res.status(201).json({
      success: true,
      message: 'Lecture created successfully',
      lecture,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET ALL LECTURES FOR COURSE ====================
exports.getLecturesByCourse = async (req, res) => {
  try {
    const lectures = await Lecture.find({
      courseId: req.params.courseId,
      isPublished: true,
    })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: lectures.length,
      lectures,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== GET SINGLE LECTURE ====================
exports.getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findByIdAndUpdate(
      req.params.lectureId,
      { $inc: { views: 1 } },
      { new: true },
    ).populate('uploadedBy', 'firstName lastName email')

    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' })
    }

    res.status(200).json({
      success: true,
      lecture,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== UPDATE LECTURE ====================
exports.updateLecture = async (req, res) => {
  try {
    const {
      title,
      description,
      topic,
      videoUrl,
      videoDuration,
      notes,
      isPublished,
      attachments,
    } = req.body

    let lecture = await Lecture.findById(req.params.lectureId)

    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' })
    }

    // Check if user is uploader or admin
    if (
      lecture.uploadedBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to update this lecture' })
    }

    const updateData = {
      title,
      description,
      topic,
      videoUrl,
      videoDuration,
      notes,
      isPublished,
    }

    if (Array.isArray(attachments)) {
      updateData.attachments = attachments
    }

    lecture = await Lecture.findByIdAndUpdate(
      req.params.lectureId,
      updateData,
      { new: true, runValidators: true },
    )

    res.status(200).json({
      success: true,
      message: 'Lecture updated successfully',
      lecture,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// ==================== DELETE LECTURE ====================
exports.deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.lectureId)

    if (!lecture) {
      return res.status(404).json({ error: 'Lecture not found' })
    }

    // Check if user is uploader or admin
    if (
      lecture.uploadedBy.toString() !== req.user.id &&
      req.user.role?.name !== 'admin' &&
      req.user.role?.name !== 'superadmin'
    ) {
      return res
        .status(403)
        .json({ error: 'Not authorized to delete this lecture' })
    }

    await Lecture.findByIdAndDelete(req.params.lectureId)

    res.status(200).json({
      success: true,
      message: 'Lecture deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
