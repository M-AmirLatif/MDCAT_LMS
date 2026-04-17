const pickRandom = (items, count) => {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return typeof count === 'number' && count > 0 ? copy.slice(0, count) : copy
}

const BIOLOGY = [
  {
    _id: 'sample-bio-01',
    topic: 'Cell Biology',
    question:
      'Which cell structure is primarily responsible for ATP production in eukaryotic cells?',
    options: [
      { text: 'Golgi apparatus' },
      { text: 'Mitochondrion' },
      { text: 'Lysosome' },
      { text: 'Ribosome' },
    ],
    correctIndex: 1,
    explanation:
      'Mitochondria generate most ATP via aerobic respiration (Krebs cycle + oxidative phosphorylation). Golgi modifies/packages proteins, lysosomes digest, ribosomes synthesize proteins.',
  },
  {
    _id: 'sample-bio-02',
    topic: 'Genetics',
    question:
      'In a heterozygous individual (Aa), what fraction of gametes carry the recessive allele (a)?',
    options: [
      { text: '0%' },
      { text: '25%' },
      { text: '50%' },
      { text: '100%' },
    ],
    correctIndex: 2,
    explanation:
      'Alleles segregate equally during meiosis, so Aa produces 50% A gametes and 50% a gametes.',
  },
  {
    _id: 'sample-bio-03',
    topic: 'Enzymes',
    question:
      'A competitive inhibitor decreases enzyme activity mainly by:',
    options: [
      { text: 'Binding to the allosteric site and changing enzyme shape' },
      { text: 'Denaturing the enzyme permanently' },
      { text: 'Competing with substrate for the active site' },
      { text: 'Reducing temperature of the reaction' },
    ],
    correctIndex: 2,
    explanation:
      'Competitive inhibitors resemble the substrate and compete for the active site. They can often be overcome by increasing substrate concentration.',
  },
  {
    _id: 'sample-bio-04',
    topic: 'Human Physiology',
    question:
      'Which blood vessel type has the greatest total cross‑sectional area in the body?',
    options: [
      { text: 'Aorta' },
      { text: 'Arteries' },
      { text: 'Capillaries' },
      { text: 'Veins' },
    ],
    correctIndex: 2,
    explanation:
      'Capillaries are extremely numerous, so their combined cross‑sectional area is the largest (and flow velocity is lowest).',
  },
  {
    _id: 'sample-bio-05',
    topic: 'Photosynthesis',
    question:
      'The light‑dependent reactions of photosynthesis occur in the:',
    options: [
      { text: 'Stroma of chloroplast' },
      { text: 'Thylakoid membranes' },
      { text: 'Mitochondrial matrix' },
      { text: 'Nucleus' },
    ],
    correctIndex: 1,
    explanation:
      'Light‑dependent reactions occur on thylakoid membranes where photosystems, ETC, and ATP synthase are located.',
  },
  {
    _id: 'sample-bio-06',
    topic: 'Ecology',
    question:
      'The relationship where both species benefit is called:',
    options: [
      { text: 'Parasitism' },
      { text: 'Commensalism' },
      { text: 'Mutualism' },
      { text: 'Predation' },
    ],
    correctIndex: 2,
    explanation:
      'Mutualism benefits both species (e.g., bees pollinating flowers). Commensalism benefits one, parasitism harms one.',
  },
]

const CHEMISTRY = [
  {
    _id: 'sample-chem-01',
    topic: 'Atomic Structure',
    question:
      'Which subatomic particle determines the atomic number of an element?',
    options: [
      { text: 'Neutron' },
      { text: 'Electron' },
      { text: 'Proton' },
      { text: 'Nucleon' },
    ],
    correctIndex: 2,
    explanation:
      'Atomic number equals the number of protons in the nucleus. Neutrons affect mass number and isotopes.',
  },
  {
    _id: 'sample-chem-02',
    topic: 'Chemical Bonding',
    question:
      'A covalent bond is formed by:',
    options: [
      { text: 'Transfer of electrons from metal to non‑metal' },
      { text: 'Sharing of electrons between atoms' },
      { text: 'Attraction between ions in a lattice' },
      { text: 'Attraction between molecules due to dipoles' },
    ],
    correctIndex: 1,
    explanation:
      'Covalent bonding involves sharing electron pairs. Ionic bonding involves electron transfer and electrostatic attraction between ions.',
  },
  {
    _id: 'sample-chem-03',
    topic: 'Stoichiometry',
    question:
      'How many moles of oxygen atoms are present in 0.50 mol of CO₂?',
    options: [
      { text: '0.25 mol' },
      { text: '0.50 mol' },
      { text: '1.00 mol' },
      { text: '2.00 mol' },
    ],
    correctIndex: 2,
    explanation:
      'Each CO₂ molecule has 2 oxygen atoms. So 0.50 mol CO₂ contains 2 × 0.50 = 1.00 mol O atoms.',
  },
  {
    _id: 'sample-chem-04',
    topic: 'Solutions',
    question:
      'Molarity (M) is defined as:',
    options: [
      { text: 'Moles of solute per kilogram of solvent' },
      { text: 'Moles of solute per liter of solution' },
      { text: 'Grams of solute per 100 mL of solution' },
      { text: 'Volume of solute per volume of solution' },
    ],
    correctIndex: 1,
    explanation:
      'Molarity = moles of solute / liter of solution. Molality uses kg of solvent.',
  },
  {
    _id: 'sample-chem-05',
    topic: 'Acids & Bases',
    question:
      'A solution with pH = 3 is how many times more acidic than a solution with pH = 5?',
    options: [
      { text: '2 times' },
      { text: '10 times' },
      { text: '100 times' },
      { text: '1000 times' },
    ],
    correctIndex: 2,
    explanation:
      'Each pH unit is a 10× change in [H⁺]. Difference of 2 units → 10² = 100×.',
  },
  {
    _id: 'sample-chem-06',
    topic: 'Thermochemistry',
    question:
      'Which process is endothermic?',
    options: [
      { text: 'Condensation of steam' },
      { text: 'Freezing of water' },
      { text: 'Melting of ice' },
      { text: 'Formation of an ionic lattice' },
    ],
    correctIndex: 2,
    explanation:
      'Melting requires absorption of heat to overcome intermolecular forces, so it is endothermic. Condensation/freezing release heat (exothermic).',
  },
]

const PHYSICS = [
  {
    _id: 'sample-phys-01',
    topic: 'Kinematics',
    question:
      'A car accelerates uniformly from rest at 2 m/s². What is its speed after 5 s?',
    options: [
      { text: '2 m/s' },
      { text: '5 m/s' },
      { text: '10 m/s' },
      { text: '25 m/s' },
    ],
    correctIndex: 2,
    explanation:
      'Use v = u + at. Here u = 0, a = 2, t = 5 → v = 0 + 2×5 = 10 m/s.',
  },
  {
    _id: 'sample-phys-02',
    topic: 'Dynamics',
    question:
      'A net force of 12 N acts on a 3 kg object. What is its acceleration?',
    options: [
      { text: '0.25 m/s²' },
      { text: '3 m/s²' },
      { text: '4 m/s²' },
      { text: '36 m/s²' },
    ],
    correctIndex: 2,
    explanation:
      'Newton’s 2nd law: F = ma → a = F/m = 12/3 = 4 m/s².',
  },
  {
    _id: 'sample-phys-03',
    topic: 'Work & Energy',
    question:
      'The SI unit of work is:',
    options: [
      { text: 'Watt' },
      { text: 'Joule' },
      { text: 'Newton' },
      { text: 'Pascal' },
    ],
    correctIndex: 1,
    explanation:
      'Work is measured in joules (J). Watt is power, newton is force, pascal is pressure.',
  },
  {
    _id: 'sample-phys-04',
    topic: 'Waves',
    question:
      'If wave speed is 300 m/s and frequency is 150 Hz, what is the wavelength?',
    options: [
      { text: '0.5 m' },
      { text: '2 m' },
      { text: '150 m' },
      { text: '450 m' },
    ],
    correctIndex: 1,
    explanation:
      'Use v = fλ → λ = v/f = 300/150 = 2 m.',
  },
  {
    _id: 'sample-phys-05',
    topic: 'Electricity',
    question:
      'Ohm’s law states that:',
    options: [
      { text: 'V = IR' },
      { text: 'P = IV' },
      { text: 'F = qE' },
      { text: 'E = mc²' },
    ],
    correctIndex: 0,
    explanation:
      'Ohm’s law: V = IR relates voltage, current, and resistance for ohmic conductors.',
  },
  {
    _id: 'sample-phys-06',
    topic: 'Thermal Physics',
    question:
      'Which mode of heat transfer does not require a medium?',
    options: [
      { text: 'Conduction' },
      { text: 'Convection' },
      { text: 'Radiation' },
      { text: 'Evaporation' },
    ],
    correctIndex: 2,
    explanation:
      'Radiation transfers energy via electromagnetic waves and can occur in vacuum. Conduction and convection need matter.',
  },
]

const ENGLISH = [
  {
    _id: 'sample-eng-01',
    topic: 'Grammar',
    question:
      'Choose the correctly punctuated sentence:',
    options: [
      { text: 'However I will try again.' },
      { text: 'However, I will try again.' },
      { text: 'However; I will try again.' },
      { text: 'However: I will try again.' },
    ],
    correctIndex: 1,
    explanation:
      '“However” used as a sentence adverb is typically followed by a comma: “However, I will try again.”',
  },
  {
    _id: 'sample-eng-02',
    topic: 'Vocabulary',
    question:
      'Select the closest synonym of “meticulous”:',
    options: [
      { text: 'Careless' },
      { text: 'Rough' },
      { text: 'Thorough' },
      { text: 'Hasty' },
    ],
    correctIndex: 2,
    explanation:
      'Meticulous means very careful and detail‑oriented; “thorough” is the closest option.',
  },
  {
    _id: 'sample-eng-03',
    topic: 'Grammar',
    question:
      'Choose the correct form: “Neither of the answers ___ correct.”',
    options: [
      { text: 'are' },
      { text: 'were' },
      { text: 'is' },
      { text: 'have' },
    ],
    correctIndex: 2,
    explanation:
      '“Neither” is treated as singular in standard usage: “Neither of the answers is correct.”',
  },
]

export const getSampleMcqs = ({ subject, limit = 10 }) => {
  const key = String(subject || '').toLowerCase()
  const bank =
    key === 'bio' || key === 'biology'
      ? BIOLOGY
      : key === 'chem' || key === 'chemistry'
        ? CHEMISTRY
        : key === 'phys' || key === 'physics'
          ? PHYSICS
          : key === 'english'
            ? ENGLISH
            : [...BIOLOGY, ...CHEMISTRY, ...PHYSICS, ...ENGLISH]

  return pickRandom(bank, limit)
}

