require('dotenv').config()
const mongoose = require('mongoose')

const User = require('./src/models/User')
const Course = require('./src/models/Course')
const Lecture = require('./src/models/Lecture')
const MCQ = require('./src/models/MCQ')
const Assignment = require('./src/models/Assignment')
const LiveSession = require('./src/models/LiveSession')
const Notification = require('./src/models/Notification')
const TestSession = require('./src/models/TestSession')
const NotificationJob = require('./src/models/NotificationJob')
const Payment = require('./src/models/Payment')
const Role = require('./src/models/Role')
const Permission = require('./src/models/Permission')

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI)
}

const ensureUser = async (data) => {
  let user = await User.findOne({ email: data.email })
  if (!user) {
    user = await User.create(data)
  } else {
    let updated = false
    if (data.role && String(user.role) !== String(data.role)) {
      user.role = data.role
      updated = true
    }
    if (data.isEmailVerified && !user.isEmailVerified) {
      user.isEmailVerified = true
      updated = true
    }
    if (updated) {
      await user.save()
    }
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

// Ensure roles and permissions
const ensureRole = async (name, permissionDocs) => {
  let role = await Role.findOne({ name })
  if (!role) {
    role = await Role.create({ name, permissions: permissionDocs.map(p => p._id) })
  } else {
    role.permissions = permissionDocs.map(p => p._id)
    await role.save()
  }
  return role
}

const ensurePermission = async (name, category) => {
  let perm = await Permission.findOne({ name })
  if (!perm) {
    perm = await Permission.create({ name, category })
  }
  return perm
}

const seed = async () => {
  console.log('🔄 Setting up Permissions and Roles...')
  
  // Set up Permissions
  const permManageCourses = await ensurePermission('manage_courses', 'teacher')
  const permTakeTests = await ensurePermission('take_tests', 'student')
  const permManageUsers = await ensurePermission('manage_users', 'admin')
  const permViewAnalytics = await ensurePermission('view_analytics', 'admin')
  
  // Set up Roles
  const superadminRole = await ensureRole('superadmin', []) // superadmin bypasses checks
  const adminRole = await ensureRole('admin', [permManageCourses, permTakeTests, permManageUsers, permViewAnalytics])
  const teacherRole = await ensureRole('teacher', [permManageCourses])
  const studentRole = await ensureRole('student', [permTakeTests])
  
  console.log('✅ Roles and Permissions configured.')

  // =====================================================
  // STEP 1: Remove ALL previously registered students
  // =====================================================
  const deletedStudents = await User.deleteMany({ role: studentRole._id })
  console.log(`🗑️  Removed ${deletedStudents.deletedCount} previous student(s)`)

  // Also clean up student-related data
  await TestSession.deleteMany({})
  await Payment.deleteMany({})
  await Notification.deleteMany({})
  await NotificationJob.deleteMany({})
  console.log('🗑️  Cleaned student test sessions, payments, and notifications')

  // Remove student enrollments from all courses
  await Course.updateMany({}, { $set: { enrolledStudents: [] } })
  console.log('🗑️  Cleared all course enrollments')

  // =====================================================
  // STEP 2: Create hardcoded staff accounts
  // =====================================================

  // --- SUPER ADMIN ---
  const superAdmin = await ensureUser({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'superadmin@mdcat.com',
    password: 'SuperAdmin@123',
    role: superadminRole._id,
    isEmailVerified: true,
    isActive: true,
  })
  console.log('✅ Super Admin → superadmin@mdcat.com / SuperAdmin@123')

  // --- ADMIN ---
  const admin = await ensureUser({
    firstName: 'Amir',
    lastName: 'Latif',
    email: 'admin@mdcat.com',
    password: 'Admin@123',
    role: adminRole._id,
    isEmailVerified: true,
    isActive: true,
  })
  console.log('✅ Admin       → admin@mdcat.com / Admin@123')

  // --- TEACHER 1 ---
  const teacher = await ensureUser({
    firstName: 'Dr. Ayesha',
    lastName: 'Khan',
    email: 'teacher@mdcat.com',
    password: 'Teacher@123',
    role: teacherRole._id,
    isEmailVerified: true,
    isActive: true,
  })
  console.log('✅ Teacher 1   → teacher@mdcat.com / Teacher@123')

  // --- TEACHER 2 ---
  const teacherTwo = await ensureUser({
    firstName: 'Sana',
    lastName: 'Malik',
    email: 'teacher2@mdcat.com',
    password: 'Teacher2@123',
    role: teacherRole._id,
    isEmailVerified: true,
    isActive: true,
  })
  console.log('✅ Teacher 2   → teacher2@mdcat.com / Teacher2@123')

  console.log('')
  console.log('📋 Students must register themselves and verify email via OTP.')
  console.log('')

  // =====================================================
  // STEP 3: Seed courses (Bio, Chem, Phys, English)
  // =====================================================

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

  const englishCourse = await ensureCourse({
    name: 'MDCAT English Essentials',
    description: 'Grammar, vocabulary, and comprehension for MDCAT English section.',
    category: 'English',
    createdBy: teacher._id,
    isPublished: true,
    topics: [
      { name: 'Grammar', description: 'Tenses, articles, prepositions' },
      { name: 'Vocabulary', description: 'Synonyms, antonyms, analogies' },
      { name: 'Comprehension', description: 'Reading passages and inference' },
    ],
  })

  // =====================================================
  // STEP 4: Seed lectures
  // =====================================================
  const sampleVideo =
    'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'

  await ensureLecture({
    title: 'Cell Structure Overview',
    description: 'Key organelles and their functions.',
    courseId: bioCourse._id,
    topic: 'Cell Biology',
    videoUrl: sampleVideo,
    videoDuration: 600,
    order: 1,
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
    order: 2,
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
    order: 1,
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
    order: 2,
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
    order: 1,
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
    order: 2,
    notes: 'Understand free body diagrams and net force.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  await ensureLecture({
    title: 'English Grammar Crash Course',
    description: 'Tenses, articles, and common grammar rules for MDCAT.',
    courseId: englishCourse._id,
    topic: 'Grammar',
    videoUrl: sampleVideo,
    videoDuration: 450,
    order: 1,
    notes: 'Focus on tense identification and article usage.',
    uploadedBy: teacher._id,
    isPublished: true,
  })

  // =====================================================
  // STEP 5: Seed MCQs
  // =====================================================

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
    difficulty: 'easy',
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
    difficulty: 'medium',
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
    difficulty: 'easy',
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
    difficulty: 'easy',
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
    difficulty: 'medium',
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
    difficulty: 'medium',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: englishCourse._id,
    topic: 'Grammar',
    question: 'Choose the correct sentence:',
    options: [
      { text: 'He go to school daily.', isCorrect: false },
      { text: 'He goes to school daily.', isCorrect: true },
      { text: 'He going to school daily.', isCorrect: false },
      { text: 'He gone to school daily.', isCorrect: false },
    ],
    explanation: 'Third person singular present tense uses "goes".',
    difficulty: 'easy',
    createdBy: teacher._id,
    isPublished: true,
  })

  await ensureMcq({
    courseId: englishCourse._id,
    topic: 'Vocabulary',
    question: 'What is the synonym of "Arduous"?',
    options: [
      { text: 'Easy', isCorrect: false },
      { text: 'Difficult', isCorrect: true },
      { text: 'Simple', isCorrect: false },
      { text: 'Comfortable', isCorrect: false },
    ],
    explanation: 'Arduous means difficult and requiring a lot of effort.',
    difficulty: 'medium',
    createdBy: teacher._id,
    isPublished: true,
  })

  // =====================================================
  // STEP 6: Seed assignments
  // =====================================================

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

  // =====================================================
  // STEP 7: Seed live sessions
  // =====================================================

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

  // =====================================================
  // DONE
  // =====================================================
  console.log('')
  console.log('═══════════════════════════════════════════════════')
  console.log('  ✅ SEED COMPLETED SUCCESSFULLY')
  console.log('═══════════════════════════════════════════════════')
  console.log('')
  console.log('  📌 STAFF LOGIN CREDENTIALS:')
  console.log('  ─────────────────────────────────────────────────')
  console.log('  Super Admin : superadmin@mdcat.com / SuperAdmin@123')
  console.log('  Admin       : admin@mdcat.com      / Admin@123')
  console.log('  Teacher 1   : teacher@mdcat.com     / Teacher@123')
  console.log('  Teacher 2   : teacher2@mdcat.com    / Teacher2@123')
  console.log('  ─────────────────────────────────────────────────')
  console.log('  📌 Students must self-register & verify email via OTP')
  console.log('═══════════════════════════════════════════════════')
  console.log('')
}

connect()
  .then(seed)
  .catch((err) => console.error(err))
  .finally(() => mongoose.disconnect())
