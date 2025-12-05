import { useEffect, useState } from 'react';

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').toString().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const useFormValidation = (
  firstName,
  lastName,
  contact,
  address,
  variants,
  selectedVariant,
  quantity,
  isDTFPrint,
  requiresDimensions,
  height,
  width,
  isSolventTarp,
  eyelets,
  hasFile,
  attachedFile
) => {
  const [dtfWarning, setDtfWarning] = useState('');

  // DTF minimum quantity warning
  useEffect(() => {
    const qty = parseInt(quantity) || 0;
    if (isDTFPrint && qty > 0 && qty < 10) {
      setDtfWarning('Minimum quantity for DTF Print is 10.');
    } else {
      setDtfWarning('');
    }
  }, [isDTFPrint, quantity]);

  const isFormValid = () => {
    if (!firstName.trim() || !lastName.trim() || !contact.trim() || !address.trim()) return false;
    // Only require variant when there are variants
    if (variants.length > 0 && !selectedVariant) return false;
    if (!quantity || isNaN(quantity) || parseInt(quantity) < 1) return false;
    // DTF print minimum 10
    if (isDTFPrint && (parseInt(quantity) || 0) < 10) return false;

    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) return false;
      if (w < 2 || h < 2) return false;               // both sides must be >= 2
      if (w < 3 && h < 3) return false;               // at least one side must be >= 3
    }
    if (isSolventTarp && (!eyelets || isNaN(eyelets) || parseInt(eyelets) < 0)) return false;
    // If yes (already have file), require attached file
    if (hasFile && !attachedFile) return false;
    return true;
  };

  return { isFormValid, dtfWarning };
};

export default useFormValidation;
