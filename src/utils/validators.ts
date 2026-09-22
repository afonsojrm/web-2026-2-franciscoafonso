/**
 * Utilitários de validação de formulários para a plataforma PetHub.
 */

/**
 * Validação algorítmica de CPF (Receita Federal) com cálculo dos dígitos verificadores.
 */
export function validateCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '');

  if (clean.length !== 11) return false;

  // Rejeita sequências de dígitos idênticos (ex: 111.111.111-11, 000.000.000-00)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;

  if (firstDigit !== parseInt(clean.charAt(9), 10)) return false;

  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;

  return secondDigit === parseInt(clean.charAt(10), 10);
}

/**
 * Validação de formato de E-mail (RFC compliant simplificado).
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim().length === 0) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validação de Telefone / Celular brasileiro (com DDD válido e 10 ou 11 dígitos).
 */
export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');

  // Deve ter 10 dígitos (fixo) ou 11 dígitos (celular)
  if (clean.length !== 10 && clean.length !== 11) return false;

  // DDD não pode começar com 0 e deve estar no intervalo válido (11 a 99)
  const ddd = parseInt(clean.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;

  // Se tiver 11 dígitos (celular), o 9º dígito deve ser 9
  if (clean.length === 11 && clean.charAt(2) !== '9') return false;

  // Evita números com todos os dígitos iguais
  if (/^(\d)\1+$/.test(clean)) return false;

  return true;
}

/**
 * Validação de CEP brasileiro (8 dígitos).
 */
export function validateCEP(cep: string): boolean {
  const clean = cep.replace(/\D/g, '');
  return clean.length === 8 && !/^(\d)\1{7}$/.test(clean);
}

/**
 * Validação de data: garante formato válido e opcionalmente impede datas futuras.
 */
export function validateDate(dateStr: string, disallowFuture = false): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  if (disallowFuture) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (date > today) return false;
  }

  return true;
}

/**
 * Validação de número positivo (> 0).
 */
export function validatePositiveNumber(value: number | string): boolean {
  const num = typeof value === 'number' ? value : parseFloat(value);
  return !isNaN(num) && num > 0;
}
