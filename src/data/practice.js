import { CATEGORIES, getCategory } from './categories';
import { slugify } from './courses';

// Sample practice questions. They are real, checked questions with explanations, but this is a
// starter bank: only some chapters have a set yet. Each set is keyed by category + subject +
// the exact chapter title used in courses.js, so a lecture can link to its chapter's DPP.

const q = (text, options, answer, explanation) => ({ text, options, answer, explanation });

const SETS = [
  // ---------------------------------------------------------------- Class 9
  ['class-9', 'Mathematics', 'Number Systems', [
    q('Which of these numbers is irrational?', ['0.25', '√2', '22/7', '3/8'], 1, '√2 cannot be written as a fraction p/q of two integers, so it is irrational. The other three are fractions.'),
    q('The decimal expansion of a rational number is…', ['always non-terminating and non-repeating', 'either terminating, or non-terminating and repeating', 'always terminating', 'always non-repeating'], 1, 'Every rational number has a decimal expansion that either ends or repeats a pattern forever.'),
    q('What is √16 + √9?', ['5', '7', '12', '25'], 1, '√16 = 4 and √9 = 3, so the sum is 4 + 3 = 7.'),
    q('Between any two different rational numbers there are…', ['no rational numbers', 'exactly one rational number', 'exactly two rational numbers', 'infinitely many rational numbers'], 3, 'You can always find a rational number halfway between two rational numbers, and keep doing it forever.'),
  ]],
  ['class-9', 'Mathematics', 'Polynomials', [
    q('What is the degree of the polynomial 3x² + 5x + 7?', ['1', '2', '3', '7'], 1, 'The degree is the highest power of x, which is 2.'),
    q('What is the zero of the polynomial p(x) = x − 4?', ['−4', '0', '4', '1/4'], 2, 'Put x − 4 = 0, so x = 4.'),
    q('Which expression is equal to (x + y)²?', ['x² + y²', 'x² + 2xy + y²', 'x² − 2xy + y²', '2x + 2y'], 1, 'The identity is (x + y)² = x² + 2xy + y².'),
    q('What is the remainder when p(x) = x² − 3x + 2 is divided by (x − 1)?', ['0', '1', '2', '−1'], 0, 'By the remainder theorem the remainder is p(1) = 1 − 3 + 2 = 0.'),
  ]],
  ['class-9', 'Science', 'Motion', [
    q('What is the SI unit of speed?', ['m/s²', 'm/s', 'km', 'N'], 1, 'Speed is distance divided by time, so its SI unit is metre per second (m/s).'),
    q('A body covers 100 m in 20 s. What is its average speed?', ['2 m/s', '5 m/s', '20 m/s', '120 m/s'], 1, 'Speed = distance ÷ time = 100 ÷ 20 = 5 m/s.'),
    q('The slope of a distance–time graph gives…', ['acceleration', 'displacement', 'speed', 'force'], 2, 'Slope = change in distance ÷ change in time, which is speed.'),
    q('Acceleration is the rate of change of…', ['distance', 'velocity', 'mass', 'time'], 1, 'Acceleration tells how quickly velocity changes.'),
  ]],
  ['class-9', 'Science', 'The Fundamental Unit of Life', [
    q('Which organelle is called the powerhouse of the cell?', ['Ribosome', 'Mitochondria', 'Golgi apparatus', 'Lysosome'], 1, 'Mitochondria release energy from food and store it as ATP.'),
    q('Who first observed cells, in a thin slice of cork?', ['Robert Hooke', 'Charles Darwin', 'Louis Pasteur', 'Gregor Mendel'], 0, 'Robert Hooke saw the box-like cells of cork in 1665 and named them "cells".'),
    q('Which structure is present in plant cells but not in animal cells?', ['Cell membrane', 'Cell wall', 'Nucleus', 'Cytoplasm'], 1, 'Plant cells have a rigid cell wall outside the cell membrane.'),
    q('Digestive enzymes are stored in…', ['lysosomes', 'chloroplasts', 'ribosomes', 'plastids'], 0, 'Lysosomes contain digestive enzymes and break down waste and worn-out parts.'),
  ]],
  ['class-9', 'Science', 'Force and Laws of Motion', [
    q("Newton's first law of motion is also called the law of…", ['gravitation', 'inertia', 'momentum', 'energy'], 1, 'A body stays at rest or in uniform motion unless a force acts on it. This property is inertia.'),
    q('What is the SI unit of force?', ['joule', 'watt', 'newton', 'pascal'], 2, 'Force is measured in newtons (N).'),
    q('A force of 10 N acts on a mass of 2 kg. What is its acceleration?', ['5 m/s²', '20 m/s²', '0.2 m/s²', '12 m/s²'], 0, 'a = F ÷ m = 10 ÷ 2 = 5 m/s².'),
    q('Momentum of a body is equal to…', ['mass × velocity', 'mass × acceleration', 'force × distance', 'mass ÷ velocity'], 0, 'Momentum p = m × v.'),
  ]],
  ['class-9', 'English', 'Tenses', [
    q('Choose the correct word: She ___ to school every day.', ['go', 'goes', 'going', 'gone'], 1, 'With a singular subject like "she", the simple present verb takes -s or -es.'),
    q('Choose the correct word: They ___ playing football right now.', ['is', 'am', 'are', 'was'], 2, '"Right now" shows present continuous. With "they" we use "are" + verb-ing.'),
    q('Choose the correct word: I have ___ my homework.', ['finish', 'finished', 'finishing', 'finishes'], 1, 'The present perfect tense is "have" + the past participle (finished).'),
    q('What is the simple past tense of "write"?', ['writed', 'wrote', 'written', 'writing'], 1, '"Wrote" is the simple past. "Written" is the past participle used after "have".'),
  ]],

  // --------------------------------------------------------------- Class 10
  ['class-10', 'Mathematics', 'Real Numbers', [
    q('What is the HCF of 12 and 18?', ['3', '6', '9', '36'], 1, '12 = 2² × 3 and 18 = 2 × 3². The common factors give 2 × 3 = 6.'),
    q('What is the LCM of 12 and 18?', ['6', '18', '36', '72'], 2, 'Take the highest powers: 2² × 3² = 36.'),
    q("Euclid's division lemma says a = bq + r, where…", ['0 ≤ r < b', '0 < r ≤ b', 'r > b', 'r = b'], 0, 'The remainder r is always at least 0 and less than the divisor b.'),
    q('For two positive integers a and b, HCF × LCM equals…', ['their sum', 'their difference', 'their product', 'their quotient'], 2, 'HCF(a, b) × LCM(a, b) = a × b.'),
  ]],
  ['class-10', 'Mathematics', 'Quadratic Equations', [
    q('Which is the standard form of a quadratic equation?', ['ax + b = 0', 'ax² + bx + c = 0, where a ≠ 0', 'ax³ + bx² + c = 0', 'a/x + b = 0'], 1, 'A quadratic has degree 2, so it is written ax² + bx + c = 0 with a ≠ 0.'),
    q('What is the discriminant of ax² + bx + c = 0?', ['b² − 4ac', 'b² + 4ac', '4ac − b', 'a² − 4bc'], 0, 'Discriminant D = b² − 4ac.'),
    q('What are the roots of x² − 5x + 6 = 0?', ['1 and 6', '2 and 3', '−2 and −3', '−1 and 6'], 1, 'x² − 5x + 6 = (x − 2)(x − 3), so x = 2 or x = 3.'),
    q('If the discriminant is less than 0, the equation has…', ['two distinct real roots', 'two equal real roots', 'no real roots', 'infinitely many roots'], 2, 'A negative discriminant means the square root is not real, so there are no real roots.'),
  ]],
  ['class-10', 'Mathematics', 'Introduction to Trigonometry', [
    q('What is sin 30°?', ['1', '1/2', '√3/2', '0'], 1, 'sin 30° = 1/2.'),
    q('What is cos 60°?', ['1/2', '√3/2', '1', '0'], 0, 'cos 60° = 1/2.'),
    q('What is tan 45°?', ['0', '1', '√3', 'not defined'], 1, 'At 45° the opposite and adjacent sides are equal, so tan 45° = 1.'),
    q('sin²θ + cos²θ is equal to…', ['0', '1', '2', 'tan θ'], 1, 'This is the basic trigonometric identity: sin²θ + cos²θ = 1.'),
  ]],
  ['class-10', 'Science', 'Chemical Reactions and Equations', [
    q('Rusting of iron is an example of…', ['reduction only', 'oxidation (corrosion)', 'neutralisation', 'sublimation'], 1, 'Iron reacts with oxygen and moisture to form iron oxide (rust), which is oxidation.'),
    q('A balanced chemical equation has…', ['the same number of atoms of each element on both sides', 'more atoms on the left side', 'more atoms on the right side', 'the same number of molecules on both sides'], 0, 'Balancing follows the law of conservation of mass, so each element has equal atoms on both sides.'),
    q('Which of these is a displacement reaction?', ['Fe + CuSO₄ → FeSO₄ + Cu', '2H₂ + O₂ → 2H₂O', 'CaCO₃ → CaO + CO₂', 'HCl + NaOH → NaCl + H₂O'], 0, 'Iron is more reactive than copper, so it displaces copper from copper sulphate.'),
    q('The reaction of quicklime (CaO) with water is…', ['endothermic', 'exothermic', 'a decomposition reaction', 'a displacement reaction'], 1, 'CaO + H₂O → Ca(OH)₂ releases a lot of heat, so it is exothermic.'),
  ]],
  ['class-10', 'Science', 'Acids, Bases and Salts', [
    q('What is the pH of a neutral solution at 25 °C?', ['0', '7', '10', '14'], 1, 'Pure water is neutral and has pH 7.'),
    q('Acids turn blue litmus paper…', ['red', 'green', 'colourless', 'yellow'], 0, 'Acids turn blue litmus red.'),
    q('What is the chemical formula of baking soda?', ['Na₂CO₃', 'NaHCO₃', 'NaOH', 'CaCO₃'], 1, 'Baking soda is sodium hydrogencarbonate, NaHCO₃.'),
    q('Which of these is a strong acid?', ['Acetic acid', 'Citric acid', 'Hydrochloric acid', 'Carbonic acid'], 2, 'Hydrochloric acid ionises almost completely in water, so it is a strong acid.'),
  ]],
  ['class-10', 'Science', 'Electricity', [
    q("Which expression is Ohm's law?", ['V = IR', 'V = I/R', 'I = VR', 'R = VI'], 0, 'The potential difference across a conductor is V = I × R.'),
    q('What is the SI unit of resistance?', ['volt', 'ampere', 'ohm', 'watt'], 2, 'Resistance is measured in ohms (Ω).'),
    q('Electric power P is equal to…', ['V × I', 'V ÷ I', 'I ÷ V', 'V + I'], 0, 'Power = potential difference × current.'),
    q('Two resistors R₁ and R₂ are connected in series. The total resistance is…', ['R₁ × R₂', 'R₁ + R₂', '1/R₁ + 1/R₂', 'R₁ − R₂'], 1, 'In series, resistances simply add up.'),
  ]],
  ['class-10', 'English', 'Reported Speech', [
    q('She said, "I like tea." → She said that she ___ tea.', ['likes', 'liked', 'will like', 'is liking'], 1, 'After a past reporting verb, the present simple changes to the past simple.'),
    q('He said, "I will come." → He said that he ___ come.', ['will', 'would', 'shall', 'can'], 1, '"Will" changes to "would" in reported speech.'),
    q('They said, "We are tired." → They said that they ___ tired.', ['are', 'were', 'have been', 'will be'], 1, '"Are" changes to "were".'),
    q('In reported speech, "today" usually changes to…', ['that day', 'tomorrow', 'yesterday', 'this day'], 0, 'Time words shift: today → that day, tomorrow → the next day, yesterday → the day before.'),
  ]],

  // -------------------------------------------------------------------- NEET
  ['neet', 'Biology', 'Cell: The Unit of Life', [
    q('Which cell organelle is the site of protein synthesis?', ['Ribosomes', 'Lysosomes', 'Golgi apparatus', 'Peroxisomes'], 0, 'Ribosomes read mRNA and join amino acids into proteins.'),
    q('The cell theory was proposed by…', ['Schleiden and Schwann', 'Watson and Crick', 'Hershey and Chase', 'Meselson and Stahl'], 0, 'Schleiden and Schwann proposed it, and Rudolf Virchow later added that new cells arise from pre-existing cells.'),
    q('Prokaryotic cells lack…', ['ribosomes', 'a cell membrane', 'a membrane-bound nucleus', 'DNA'], 2, 'Prokaryotes have DNA in a nucleoid, not inside a membrane-bound nucleus.'),
    q('Which organelle is the main site of ATP synthesis in a eukaryotic cell?', ['Mitochondria', 'Ribosomes', 'Lysosomes', 'Vacuole'], 0, 'ATP is made mainly in mitochondria through oxidative phosphorylation.'),
  ]],
  ['neet', 'Biology', 'Biomolecules', [
    q('Which is the most abundant protein in the whole biosphere?', ['Collagen', 'RuBisCO', 'Haemoglobin', 'Insulin'], 1, 'RuBisCO (in plants) is the most abundant protein in the biosphere. Collagen is the most abundant in the animal world.'),
    q('The monomers of proteins are…', ['nucleotides', 'amino acids', 'fatty acids', 'monosaccharides'], 1, 'Proteins are polymers of amino acids.'),
    q('The bond that joins two amino acids is a…', ['glycosidic bond', 'peptide bond', 'phosphodiester bond', 'hydrogen bond'], 1, 'The –CO–NH– link between amino acids is a peptide bond.'),
    q('Which bond joins monosaccharides in a polysaccharide?', ['Peptide bond', 'Glycosidic bond', 'Ester bond', 'Phosphodiester bond'], 1, 'Monosaccharides are linked by glycosidic bonds.'),
  ]],
  ['neet', 'Biology', 'Cell Cycle and Cell Division', [
    q('Chromosomes line up at the equatorial plate during…', ['prophase', 'metaphase', 'anaphase', 'telophase'], 1, 'Metaphase is the stage where chromosomes align at the cell\'s equator.'),
    q('Crossing over takes place during…', ['prophase I of meiosis', 'metaphase of mitosis', 'anaphase II', 'telophase I'], 0, 'Crossing over happens at the pachytene stage of prophase I.'),
    q('How many daughter cells are formed from one cell after complete meiosis?', ['2', '4', '8', '1'], 1, 'Meiosis has two divisions and produces four cells.'),
    q('Mitosis produces…', ['four haploid cells', 'two genetically identical daughter cells', 'two genetically different cells', 'one cell'], 1, 'Mitosis gives two daughter cells with the same chromosome number and genetic material as the parent.'),
  ]],
  ['neet', 'Biology', 'Photosynthesis in Higher Plants', [
    q('The light reactions of photosynthesis take place in the…', ['stroma', 'thylakoid membranes', 'cytoplasm', 'mitochondria'], 1, 'Light-dependent reactions occur on the thylakoid membranes of the chloroplast.'),
    q('The Calvin cycle takes place in the…', ['stroma', 'grana', 'nucleus', 'cell wall'], 0, 'The dark reactions (Calvin cycle) occur in the stroma of the chloroplast.'),
    q('What is the first stable product of the Calvin cycle (C₃ pathway)?', ['Oxaloacetic acid', '3-phosphoglyceric acid (PGA)', 'Glucose', 'RuBP'], 1, 'CO₂ is fixed by RuBisCO into 3-phosphoglyceric acid, a three-carbon compound.'),
    q('The oxygen released during photosynthesis comes from…', ['carbon dioxide', 'water', 'glucose', 'chlorophyll'], 1, 'Water is split in the light reactions and releases oxygen.'),
  ]],
  ['neet', 'Physics', 'Units and Measurements', [
    q('What is the dimensional formula of force?', ['MLT⁻²', 'ML²T⁻²', 'MLT⁻¹', 'ML⁻¹T⁻²'], 0, 'Force = mass × acceleration = M × LT⁻² = MLT⁻².'),
    q('What is the SI unit of power?', ['joule', 'watt', 'newton', 'pascal'], 1, 'Power is measured in watts (W), which is joule per second.'),
    q('How many significant figures are there in 0.00250?', ['2', '3', '5', '6'], 1, 'Leading zeros do not count. The digits 2, 5 and the trailing 0 after the decimal point count, giving 3.'),
    q('Which of these is a base (fundamental) SI quantity?', ['Force', 'Velocity', 'Length', 'Energy'], 2, 'Length is a base quantity. Force, velocity and energy are derived from base quantities.'),
  ]],
  ['neet', 'Physics', 'Laws of Motion', [
    q('A 2 kg mass accelerates at 3 m/s². What is the net force on it?', ['1.5 N', '5 N', '6 N', '9 N'], 2, 'F = ma = 2 × 3 = 6 N.'),
    q("According to Newton's third law, action and reaction forces are…", ['equal and opposite, and act on different bodies', 'equal and opposite, and act on the same body', 'unequal and opposite', 'equal and in the same direction'], 0, 'They are equal in size, opposite in direction, and act on two different bodies, so they do not cancel.'),
    q('If the net external force on a body is zero, its…', ['velocity remains constant', 'speed must increase', 'it must stop', 'acceleration equals g'], 0, 'With zero net force there is no acceleration, so the velocity stays constant (Newton\'s first law).'),
    q('Impulse is equal to the…', ['change in momentum', 'change in energy', 'force × distance', 'mass × velocity²'], 0, 'Impulse = force × time = change in momentum.'),
  ]],
  ['neet', 'Chemistry', 'Some Basic Concepts of Chemistry', [
    q("Avogadro's number is approximately…", ['6.022 × 10²³', '6.022 × 10²⁶', '3.011 × 10²³', '1.602 × 10⁻¹⁹'], 0, 'One mole contains about 6.022 × 10²³ particles.'),
    q('What is the molar mass of water (H₂O)?', ['16 g/mol', '18 g/mol', '20 g/mol', '2 g/mol'], 1, '2 × 1 (hydrogen) + 16 (oxygen) = 18 g/mol.'),
    q('How many moles are there in 36 g of water?', ['1', '2', '3', '4'], 1, 'Moles = mass ÷ molar mass = 36 ÷ 18 = 2.'),
    q('One mole of any substance contains…', ['6.022 × 10²³ particles', '1 gram of the substance', '22.4 L of it always', 'exactly 18 g'], 0, 'A mole is defined as 6.022 × 10²³ elementary particles.'),
  ]],
  ['neet', 'Chemistry', 'Structure of Atom', [
    q('What is the maximum number of electrons in the shell with n = 2?', ['2', '8', '18', '32'], 1, 'The maximum is 2n² = 2 × 4 = 8.'),
    q('How many neutrons does carbon-12 (atomic number 6) have?', ['6', '12', '18', '0'], 0, 'Neutrons = mass number − atomic number = 12 − 6 = 6.'),
    q("Heisenberg's uncertainty principle says we cannot know exactly and at the same time the…", ['position and momentum of an electron', 'mass and charge of an electron', 'energy and mass of an atom', 'charge and spin of an electron'], 0, 'The more precisely the position is known, the less precisely the momentum can be known.'),
    q('Which quantum number determines the shape of an orbital?', ['Principal quantum number', 'Azimuthal quantum number (l)', 'Magnetic quantum number', 'Spin quantum number'], 1, 'The azimuthal quantum number l gives the shape (s, p, d, f).'),
  ]],
];

export const QUIZ_SETS = SETS.map(([categoryId, subject, chapter, questions]) => {
  const id = `dpp-${categoryId}-${slugify(subject)}-${slugify(chapter)}`;
  return {
    id,
    categoryId,
    subject,
    chapter,
    title: `${chapter} DPP`,
    questions: questions.map((question, i) => ({ ...question, id: `${id}:q${i + 1}` })),
  };
});

export const getQuizSet = (id) => QUIZ_SETS.find((s) => s.id === id) || null;

/** The DPP for a given chapter, or null when no set has been written for it yet. */
export const quizSetForChapter = (categoryId, subject, chapterTitle) =>
  QUIZ_SETS.find((s) => s.categoryId === categoryId && s.subject === subject && s.chapter === chapterTitle) || null;

/**
 * Mixed tests, one per category, built from the first two questions of every set in it.
 * They reuse the same question bank, so there is nothing extra to keep in sync.
 */
export const TESTS = CATEGORIES.map((category) => {
  const sets = QUIZ_SETS.filter((s) => s.categoryId === category.id);
  return {
    id: `test-${category.id}`,
    categoryId: category.id,
    title: `${category.title} mixed quiz`,
    subject: 'All subjects',
    chapter: `${sets.length} chapters`,
    questions: sets.flatMap((set) => set.questions.slice(0, 2)),
  };
});

export const getTest = (id) => TESTS.find((t) => t.id === id) || null;
export const getAnySet = (id) => getQuizSet(id) || getTest(id);
export const categoryTitle = (categoryId) => (getCategory(categoryId) || {}).title || categoryId;

/** Score a set of answers. `answers` maps question id -> chosen option index. */
export function scoreAnswers(questions, answers) {
  let correct = 0;
  questions.forEach((question) => {
    if (answers[question.id] === question.answer) correct += 1;
  });
  const total = questions.length;
  return { correct, total, percent: total ? Math.round((correct / total) * 100) : 0 };
}
