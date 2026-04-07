require('dotenv').config()
const mongoose = require('mongoose')

const User = require('./src/models/User')
const Course = require('./src/models/Course')
const Lecture = require('./src/models/Lecture')
const MCQ = require('./src/models/MCQ')
const Assignment = require('./src/models/Assignment')
const LiveSession = require('./src/models/LiveSession')
const Notification = require('./src/models/Notification')

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
}

const ensureUser = async (data) => {
  let user = await User.findOne({ email: data.email })
  if (!user) {
    user = await User.create(data)
  }
  return user
}

const ensureCourse = async (data) => {
  let course = await Course.findOne({ name: data.name })
  if (!course) {
    course = await Course.create(data)
  }
  return course
}

const ensureLecture = async (data) => {
  const existing = await Lecture.findOne({
    courseId: data.courseId,
    title: data.title,
  })
  if (!existing) {
    await Lecture.create(data)
  }
}

const ensureMcq = async (data) => {
  const existing = await MCQ.findOne({
    courseId: data.courseId,
    question: data.question,
  })
  if (!existing) {
    await MCQ.create(data)
  }
}

const ensureAssignment = async (data) => {
  const existing = await Assignment.findOne({
    courseId: data.courseId,
    title: data.title,
  })
  if (!existing) {
    await Assignment.create(data)
  }
}

const ensureLiveSession = async (data) => {
  const existing = await LiveSession.findOne({
    courseId: data.courseId,
    title: data.title,
  })
  if (!existing) {
    await LiveSession.create(data)
  }
}

const ensureNotification = async (data) => {
  const existing = await Notification.findOne({
    recipientId: data.recipientId,
    title: data.title,
  })
  if (!existing) {
    await Notification.create(data)
  }
}

const enrollStudent = async (course, studentId) => {
  const already = course.enrolledStudents.some(
    (id) => id.toString() === studentId.toString(),
  )
  if (!already) {
    course.enrolledStudents.push(studentId)
    await course.save()
  }
}

const seed = async () => {
  const teacher = await ensureUser({
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'teacher@mdcat.com',
    password: 'Password123',
    role: 'teacher',
  })

  const teacherTwo = await ensureUser({
    firstName: 'Sana',
    lastName: 'Malik',
    email: 'teacher2@mdcat.com',
    password: 'Password123',
    role: 'teacher',
  })

  const student = await ensureUser({
    firstName: 'Ali',
    lastName: 'Raza',
    email: 'student@mdcat.com',
    password: 'Password123',
    role: 'student',
  })

  const bioCourse = await ensureCourse({
    name: 'MDCAT Biology Crash Course',
    description: 'High-yield biology topics with concept-first approach.',
    category: 'Biology',
    createdBy: teacher._id,
    isPublished: true,
    topics: [
      { name: 'Cell Biology', description: 'Cell structure and organelles' },
      { name: 'Genetics', description: 'Mendelian and molecular genetics' },
    ],
  })

  const chemCourse = await ensureCourse({
    name: 'MDCAT Chemistry Mastery',
    description: 'Core chemistry concepts with numericals and reasoning.',
    category: 'Chemistry',
    createdBy: teacherTwo._id,
    isPublished: true,
    topics: [
      { name: 'Atomic Structure', description: 'Subatomic particles and models' },
      { name: 'Chemical Bonding', description: 'Ionic, covalent, metallic bonds' },
      { name: 'Stoichiometry', description: 'Moles, equations, limiting reagents' },
    ],
  })

  const physicsCourse = await ensureCourse({
    name: 'MDCAT Physics Quick Revision',
    description: 'Fast-track physics revision with formulas and examples.',
    category: 'Physics',
    createdBy: teacher._id,
    isPublished: true,
    topics: [
      { name: 'Kinematics', description: 'Motion in one and two dimensions' },
      { name: 'Dynamics', description: 'Forces and Newtons laws' },
      { name: 'Waves', description: 'Wave motion and sound basics' },
    ],
  })

  await enrollStudent(bioCourse, student._id)
  await enrollStudent(chemCourse, student._id)
  await enrollStudent(physicsCourse, student._id)

  const sampleVideo =
    'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'

  await ensureLecture({
    title: 'Cell Structure Overview',
    description: 'Key organelles and their functions.',
    courseId: bioCourse._id,
    topic: 'Cell Biology',
    videoUrl: sampleVideo,
    videoDuration: 600,
    notes: 'Review nucleus, mitochondria, and ER for quick recall.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'Genetics Quick Recap',
    description: 'Dominant vs recessive traits and basic inheritance.',
    courseId: bioCourse._id,
    topic: 'Genetics',
    videoUrl: sampleVideo,
    videoDuration: 540,
    notes: 'Focus on Punnett squares and genotype ratios.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'Atomic Structure Essentials',
    description: 'Protons, neutrons, electrons, and atomic number.',
    courseId: chemCourse._id,
    topic: 'Atomic Structure',
    videoUrl: sampleVideo,
    videoDuration: 480,
    notes: 'Memorize common isotopes and electronic configuration.',
    uploadedBy: teacherTwo._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'Chemical Bonding Basics',
    description: 'Types of bonds and their properties.',
    courseId: chemCourse._id,
    topic: 'Chemical Bonding',
    videoUrl: sampleVideo,
    videoDuration: 510,
    notes: 'Compare ionic and covalent bond formation.',
    uploadedBy: teacherTwo._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'Kinematics One-Dimensional',
    description: 'Equations of motion and basic graphs.',
    courseId: physicsCourse._id,
    topic: 'Kinematics',
    videoUrl: sampleVideo,
    videoDuration: 520,
    notes: 'Practice SUVAT equations with simple problems.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'Newtons Laws Overview',
    description: 'First, second, and third law applications.',
    courseId: physicsCourse._id,
    topic: 'Dynamics',
    videoUrl: sampleVideo,
    videoDuration: 560,
    notes: 'Understand free body diagrams and net force.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: bioCourse._id,
    topic: 'Cell Biology',
    question: 'Which organelle is known as the powerhouse of the cell?',
    options: [
      { text: 'Nucleus', isCorrect: false },
      { text: 'Mitochondria', isCorrect: true },
      { text: 'Golgi apparatus', isCorrect: false },
      { text: 'Ribosome', isCorrect: false },
    ],
    explanation: 'Mitochondria produce ATP, the energy currency of the cell.',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: bioCourse._id,
    topic: 'Genetics',
    question: 'DNA replication occurs during which phase of the cell cycle?',
    options: [
      { text: 'G1 phase', isCorrect: false },
      { text: 'S phase', isCorrect: true },
      { text: 'G2 phase', isCorrect: false },
      { text: 'M phase', isCorrect: false },
    ],
    explanation: 'S phase is the synthesis phase where DNA is replicated.',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: chemCourse._id,
    topic: 'Atomic Structure',
    question: 'What is the atomic number of carbon?',
    options: [
      { text: '4', isCorrect: false },
      { text: '6', isCorrect: true },
      { text: '8', isCorrect: false },
      { text: '12', isCorrect: false },
    ],
    explanation: 'Carbon has 6 protons, so its atomic number is 6.',
    createdBy: teacherTwo._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: chemCourse._id,
    topic: 'Chemical Bonding',
    question: 'Which bond involves the sharing of electrons?',
    options: [
      { text: 'Ionic bond', isCorrect: false },
      { text: 'Covalent bond', isCorrect: true },
      { text: 'Metallic bond', isCorrect: false },
      { text: 'Hydrogen bond', isCorrect: false },
    ],
    explanation: 'Covalent bonds are formed by sharing electrons.',
    createdBy: teacherTwo._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: physicsCourse._id,
    topic: 'Dynamics',
    question: 'A body at rest remains at rest unless acted upon by?',
    options: [
      { text: 'Gravitational force', isCorrect: false },
      { text: 'Unbalanced external force', isCorrect: true },
      { text: 'Magnetic force', isCorrect: false },
      { text: 'Frictional force', isCorrect: false },
    ],
    explanation: 'Newtons first law states that an unbalanced force is needed.',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: physicsCourse._id,
    topic: 'Kinematics',
    question: 'Which equation is used for uniform acceleration?',
    options: [
      { text: 'v = u + at', isCorrect: true },
      { text: 'F = ma', isCorrect: false },
      { text: 'P = W/t', isCorrect: false },
      { text: 'E = mc^2', isCorrect: false },
    ],
    explanation: 'v = u + at is the first equation of motion.',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureAssignment({
    courseId: bioCourse._id,
    title: 'Cell Biology Short Notes',
    description: 'Write short notes on key organelles.',
    instructions: 'Cover nucleus, mitochondria, and Golgi apparatus.',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxMarks: 20,
    createdBy: teacher._id,
  })

  await ensureAssignment({
    courseId: chemCourse._id,
    title: 'Atomic Structure Worksheet',
    description: 'Solve the numerical problems on isotopes and ions.',
    instructions: 'Show full working for each answer.',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    maxMarks: 25,
    createdBy: teacherTwo._id,
  })

  await ensureAssignment({
    courseId: physicsCourse._id,
    title: 'Newton Laws Practice',
    description: 'Apply Newton laws to real-world scenarios.',
    instructions: 'Submit clear steps and diagrams.',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    maxMarks: 30,
    createdBy: teacher._id,
  })

  await ensureLiveSession({
    courseId: bioCourse._id,
    teacherId: teacher._id,
    title: 'Live Biology Doubt Solving',
    description: 'Bring your questions on cell biology and genetics.',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    joinUrl: 'https://meet.example.com/mdcat-bio',
    status: 'scheduled',
  })

  await ensureLiveSession({
    courseId: chemCourse._id,
    teacherId: teacherTwo._id,
    title: 'Chemistry Rapid Revision',
    description: 'Quick review of bonding and atomic structure.',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    joinUrl: 'https://meet.example.com/mdcat-chem',
    status: 'scheduled',
  })

  await ensureNotification({
    recipientId: student._id,
    type: 'announcement',
    title: 'Welcome to MDCAT LMS',
    message: 'Your courses are ready. Start with Biology today.',
  })

  await ensureNotification({
    recipientId: student._id,
    type: 'lecture',
    title: 'New lecture uploaded',
    message: 'Genetics Quick Recap is now available in Biology.',
  })

  console.log('Seed completed.')
}

connect()
  .then(seed)
  .catch((err) => console.error(err))
  .finally(() => mongoose.disconnect())
