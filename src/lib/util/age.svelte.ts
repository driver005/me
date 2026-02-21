export function calculate_age(birthDateString: string) {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // If the birthday hasn't happened yet this year, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
