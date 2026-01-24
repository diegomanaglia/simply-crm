// Validation utilities for forms

export const validateCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned[10])) return false;

  return true;
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned[13])) return false;

  return true;
};

export const validateDocument = (document: string): { valid: boolean; type: 'cpf' | 'cnpj' | null; message: string } => {
  if (!document.trim()) {
    return { valid: true, type: null, message: '' };
  }
  
  const cleaned = document.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    const isValid = validateCPF(document);
    return {
      valid: isValid,
      type: 'cpf',
      message: isValid ? '' : 'CPF inválido',
    };
  }
  
  if (cleaned.length === 14) {
    const isValid = validateCNPJ(document);
    return {
      valid: isValid,
      type: 'cnpj',
      message: isValid ? '' : 'CNPJ inválido',
    };
  }
  
  return {
    valid: false,
    type: null,
    message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos',
  };
};

export const validateEmail = (email: string): { valid: boolean; message: string } => {
  if (!email.trim()) {
    return { valid: true, message: '' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    valid: isValid,
    message: isValid ? '' : 'Email inválido',
  };
};

export const validatePhone = (phone: string): { valid: boolean; message: string } => {
  if (!phone.trim()) {
    return { valid: true, message: '' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  const isValid = cleaned.length >= 10 && cleaned.length <= 11;
  
  return {
    valid: isValid,
    message: isValid ? '' : 'Telefone deve ter 10 ou 11 dígitos',
  };
};

export const formatCPF = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatCNPJ = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 14);
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export const formatDocument = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return formatCPF(value);
  }
  return formatCNPJ(value);
};

export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 10) {
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return cleaned
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
};

export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
};

export const parseCurrencyToNumber = (value: string): number => {
  const cleaned = value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};
