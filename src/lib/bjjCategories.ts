// BJJ Weight Categories based on IBJJF rules
// Categories are organized by age group and gender

export type Gender = 'male' | 'female';

export interface WeightCategory {
  name: string;
  minWeight: number;
  maxWeight: number;
}

export interface AgeCategory {
  name: string;
  minAge: number;
  maxAge: number;
  maleCategories: WeightCategory[];
  femaleCategories: WeightCategory[];
}

// Adult categories (18+ years)
const adultMaleCategories: WeightCategory[] = [
  { name: 'Galo', minWeight: 0, maxWeight: 57.5 },
  { name: 'Pluma', minWeight: 57.5, maxWeight: 64 },
  { name: 'Pena', minWeight: 64, maxWeight: 70 },
  { name: 'Leve', minWeight: 70, maxWeight: 76 },
  { name: 'Médio', minWeight: 76, maxWeight: 82.3 },
  { name: 'Meio-Pesado', minWeight: 82.3, maxWeight: 88.3 },
  { name: 'Pesado', minWeight: 88.3, maxWeight: 94.3 },
  { name: 'Super-Pesado', minWeight: 94.3, maxWeight: 100.5 },
  { name: 'Pesadíssimo', minWeight: 100.5, maxWeight: Infinity },
];

const adultFemaleCategories: WeightCategory[] = [
  { name: 'Palha', minWeight: 0, maxWeight: 48.5 },
  { name: 'Galo', minWeight: 48.5, maxWeight: 53.5 },
  { name: 'Pluma', minWeight: 53.5, maxWeight: 58.5 },
  { name: 'Pena', minWeight: 58.5, maxWeight: 64 },
  { name: 'Leve', minWeight: 64, maxWeight: 69 },
  { name: 'Médio', minWeight: 69, maxWeight: 74 },
  { name: 'Meio-Pesado', minWeight: 74, maxWeight: 79.3 },
  { name: 'Pesado', minWeight: 79.3, maxWeight: Infinity },
];

// Master categories (30+ years) - same weights as adult
const masterMaleCategories = adultMaleCategories;
const masterFemaleCategories = adultFemaleCategories;

// Juvenile categories (16-17 years)
const juvenileMaleCategories: WeightCategory[] = [
  { name: 'Galo', minWeight: 0, maxWeight: 53.5 },
  { name: 'Pluma', minWeight: 53.5, maxWeight: 58.5 },
  { name: 'Pena', minWeight: 58.5, maxWeight: 64 },
  { name: 'Leve', minWeight: 64, maxWeight: 69 },
  { name: 'Médio', minWeight: 69, maxWeight: 74 },
  { name: 'Meio-Pesado', minWeight: 74, maxWeight: 79.3 },
  { name: 'Pesado', minWeight: 79.3, maxWeight: 84.3 },
  { name: 'Super-Pesado', minWeight: 84.3, maxWeight: 89.3 },
  { name: 'Pesadíssimo', minWeight: 89.3, maxWeight: Infinity },
];

const juvenileFemaleCategories: WeightCategory[] = [
  { name: 'Palha', minWeight: 0, maxWeight: 44.3 },
  { name: 'Galo', minWeight: 44.3, maxWeight: 48.3 },
  { name: 'Pluma', minWeight: 48.3, maxWeight: 52.5 },
  { name: 'Pena', minWeight: 52.5, maxWeight: 56.5 },
  { name: 'Leve', minWeight: 56.5, maxWeight: 60.5 },
  { name: 'Médio', minWeight: 60.5, maxWeight: 65 },
  { name: 'Meio-Pesado', minWeight: 65, maxWeight: 69 },
  { name: 'Pesado', minWeight: 69, maxWeight: Infinity },
];

// Infant categories (4-15 years) - simplified
const infantMaleCategories: WeightCategory[] = [
  { name: 'Galosinho', minWeight: 0, maxWeight: 21 },
  { name: 'Palinha', minWeight: 21, maxWeight: 24 },
  { name: 'Galinho', minWeight: 24, maxWeight: 27 },
  { name: 'Pluminha', minWeight: 27, maxWeight: 30 },
  { name: 'Peninha', minWeight: 30, maxWeight: 33.5 },
  { name: 'Levinho', minWeight: 33.5, maxWeight: 37 },
  { name: 'Medinho', minWeight: 37, maxWeight: 41 },
  { name: 'Meio-Pesadinho', minWeight: 41, maxWeight: 45 },
  { name: 'Pesadinho', minWeight: 45, maxWeight: 50 },
  { name: 'Super-Pesadinho', minWeight: 50, maxWeight: 56 },
  { name: 'Pesadíssimo', minWeight: 56, maxWeight: Infinity },
];

const infantFemaleCategories: WeightCategory[] = [
  { name: 'Galosinha', minWeight: 0, maxWeight: 19 },
  { name: 'Palinha', minWeight: 19, maxWeight: 22 },
  { name: 'Galinha', minWeight: 22, maxWeight: 25 },
  { name: 'Pluminha', minWeight: 25, maxWeight: 28 },
  { name: 'Peninha', minWeight: 28, maxWeight: 31.5 },
  { name: 'Levinha', minWeight: 31.5, maxWeight: 35 },
  { name: 'Medinha', minWeight: 35, maxWeight: 39 },
  { name: 'Meio-Pesadinha', minWeight: 39, maxWeight: 43 },
  { name: 'Pesadinha', minWeight: 43, maxWeight: 48 },
  { name: 'Super-Pesadinha', minWeight: 48, maxWeight: 54 },
  { name: 'Pesadíssima', minWeight: 54, maxWeight: Infinity },
];

export const ageCategories: AgeCategory[] = [
  {
    name: 'Infantil',
    minAge: 4,
    maxAge: 15,
    maleCategories: infantMaleCategories,
    femaleCategories: infantFemaleCategories,
  },
  {
    name: 'Juvenil',
    minAge: 16,
    maxAge: 17,
    maleCategories: juvenileMaleCategories,
    femaleCategories: juvenileFemaleCategories,
  },
  {
    name: 'Adulto',
    minAge: 18,
    maxAge: 29,
    maleCategories: adultMaleCategories,
    femaleCategories: adultFemaleCategories,
  },
  {
    name: 'Master 1',
    minAge: 30,
    maxAge: 35,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
  {
    name: 'Master 2',
    minAge: 36,
    maxAge: 40,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
  {
    name: 'Master 3',
    minAge: 41,
    maxAge: 45,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
  {
    name: 'Master 4',
    minAge: 46,
    maxAge: 50,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
  {
    name: 'Master 5',
    minAge: 51,
    maxAge: 55,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
  {
    name: 'Master 6',
    minAge: 56,
    maxAge: Infinity,
    maleCategories: masterMaleCategories,
    femaleCategories: masterFemaleCategories,
  },
];

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getAgeCategory(age: number): AgeCategory | null {
  return ageCategories.find(cat => age >= cat.minAge && age <= cat.maxAge) || null;
}

export function getWeightCategory(
  weight: number,
  age: number,
  gender: Gender
): { ageCategory: AgeCategory; weightCategory: WeightCategory } | null {
  const ageCategory = getAgeCategory(age);
  if (!ageCategory) return null;

  const categories = gender === 'male' 
    ? ageCategory.maleCategories 
    : ageCategory.femaleCategories;

  const weightCategory = categories.find(
    cat => weight > cat.minWeight && weight <= cat.maxWeight
  );

  if (!weightCategory) return null;

  return { ageCategory, weightCategory };
}

export function formatWeight(maxWeight: number): string {
  if (maxWeight === Infinity) return 'Sem limite';
  return `${maxWeight} kg`;
}
