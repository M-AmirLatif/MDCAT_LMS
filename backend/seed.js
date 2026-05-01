require('dotenv').config()
const mongoose = require('mongoose')

const User = require('./src/models/User')
const Course = require('./src/models/Course')
const MCQ = require('./src/models/MCQ')
const TestSession = require('./src/models/TestSession')
const Payment = require('./src/models/Payment')
const Notification = require('./src/models/Notification')
const NotificationJob = require('./src/models/NotificationJob')
const Role = require('./src/models/Role')
const Permission = require('./src/models/Permission')
const mdcatData = require('./src/data/mdcatData')

const connect = async () => mongoose.connect(process.env.MONGO_URI)

const ensurePermission = async (name, category) => {
  let permission = await Permission.findOne({ name })
  if (!permission) permission = await Permission.create({ name, category })
  return permission
}

const ensureRole = async (name, permissions) => {
  let role = await Role.findOne({ name })
  if (!role) {
    role = await Role.create({ name, permissions: permissions.map((item) => item._id) })
  } else {
    role.permissions = permissions.map((item) => item._id)
    await role.save()
  }
  return role
}

const ensureUser = async (data) => {
  let user = await User.findOne({ email: data.email })
  if (!user) {
    user = await User.create(data)
  } else {
    Object.assign(user, data)
    await user.save()
  }
  return user
}

const seed = async () => {
  console.log('Setting up MDCAT-only MCQ platform seed...')

  const permManageCourses = await ensurePermission('manage_courses', 'teacher')
  const permTakeTests = await ensurePermission('take_tests', 'student')
  const permManageUsers = await ensurePermission('manage_users', 'admin')
  const permViewAnalytics = await ensurePermission('view_analytics', 'admin')

  const superadminRole = await ensureRole('superadmin', [])
  const adminRole = await ensureRole('admin', [permManageCourses, permTakeTests, permManageUsers, permViewAnalytics])
  const teacherRole = await ensureRole('teacher', [permManageCourses])
  const studentRole = await ensureRole('student', [permTakeTests])

  await Promise.all([
    TestSession.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
    NotificationJob.deleteMany({}),
    MCQ.deleteMany({}),
    Course.deleteMany({}),
    User.deleteMany({ role: studentRole._id }),
  ])

  const superAdmin = await ensureUser({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@mdcat.com',
    password: 'SuperAdmin@123',
    role: superadminRole._id,
    isEmailVerified: true,
    isActive: true,
  })

  const admin = await ensureUser({
    firstName: 'Amir',
    lastName: 'Latif',
    email: 'admin@mdcat.com',
    password: 'Admin@123',
    role: adminRole._id,
    isEmailVerified: true,
    isActive: true,
  })

  const biologyTeacher = await ensureUser({
    firstName: 'Dr. Hira',
    lastName: 'Khan',
    email: 'teacher@mdcat.com',
    password: 'Teacher@123',
    role: teacherRole._id,
    isEmailVerified: true,
    isActive: true,
  })

  const chemistryTeacher = await ensureUser({
    firstName: 'Prof. Adeel',
    lastName: 'Raza',
    email: 'teacher2@mdcat.com',
    password: 'Teacher2@123',
    role: teacherRole._id,
    isEmailVerified: true,
    isActive: true,
  })

  const teacherBySubject = {
    Biology: biologyTeacher,
    Chemistry: chemistryTeacher,
    Physics: biologyTeacher,
    English: chemistryTeacher,
  }

  const subjectCourses = {}

  for (const subject of mdcatData.subjects) {
    const chapters = mdcatData.chapters
      .filter((chapter) => chapter.subjectId === subject.id)
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        description: chapter.description,
      }))

    const teacher = teacherBySubject[subject.name]

    const course = await Course.create({
      name: `${subject.name} MDCAT MCQ Bank`,
      description: subject.description,
      category: subject.name,
      subject: subject.name,
      createdBy: teacher._id,
      isPublished: true,
      isFree: true,
      price: 0,
      topics: chapters.map((chapter) => ({ name: chapter.name, description: chapter.description })),
      chapters,
    })

    subjectCourses[subject.id] = course
  }

  for (const mcq of mdcatData.mcqs) {
    const course = subjectCourses[mcq.subjectId]
    const teacher = teacherBySubject[course.category]
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(mcq.correctAnswer)

    await MCQ.create({
      courseId: course._id,
      topic: mdcatData.chapters.find((chapter) => chapter.id === mcq.chapterId)?.name || '',
      subject: course.category,
      chapterId: mcq.chapterId,
      chapterName: mdcatData.chapters.find((chapter) => chapter.id === mcq.chapterId)?.name || '',
      question: mcq.question,
      options: mcq.options.map((option, index) => ({
        text: option,
        isCorrect: index === correctIndex,
      })),
      correctAnswer: mcq.correctAnswer,
      explanation: mcq.explanation,
      difficulty: mcq.difficulty.toLowerCase(),
      createdBy: teacher._id,
      isPublished: true,
    })
  }

  console.log('MDCAT-only seed completed successfully.')
  console.log('Staff accounts:')
  console.log(`Super Admin: ${superAdmin.email} / SuperAdmin@123`)
  console.log(`Admin: ${admin.email} / Admin@123`)
  console.log(`Teacher 1: ${biologyTeacher.email} / Teacher@123`)
  console.log(`Teacher 2: ${chemistryTeacher.email} / Teacher2@123`)
  console.log(`Seeded subjects: ${mdcatData.subjects.map((item) => item.name).join(', ')}`)
  console.log(`Total MCQs: ${mdcatData.mcqs.length}`)
}

connect()
  .then(seed)
  .catch((error) => console.error(error))
  .finally(() => mongoose.disconnect())
