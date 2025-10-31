import { useEffect, useState } from 'react';

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').toString().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const useOrderCalculation = (selectedVariant, quantity, width, height, hasFile, requiresDimensions, isSolventTarp, eyelets) => {
  const [total, setTotal] = useState(0);
  const [dimError, setDimError] = useState(null);
  const [dimWarning, setDimWarning] = useState('');

  useEffect(() => {
    // LIVE WARNING: runs on every change to width/height
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);

      const parts = [];
      if (Number.isFinite(w) && w < 2) parts.push('Width is below 2"');
      if (Number.isFinite(h) && h < 2) parts.push('Height is below 2"');

      if (Number.isFinite(h) && Number.isFinite(w)) {
        const small = Math.min(h, w);
        const large = Math.max(h, w);
        if (small < 2 || large < 3) {
          // orientation-agnostic 2×3 rule
          if (!parts.length) parts.push('Minimum size is 2 × 3 inches (any orientation)');
        }
      }

      setDimWarning(parts.length ? `Minimum size: 2 × 3 inches. ${parts.join('. ')}` : '');
    } else {
      setDimWarning('');
    }

    // PRICE + FORM VALIDATION (kept from your previous logic)
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) {
        setDimError(null);
        setTotal(0);
        return;
      }
      const small = Math.min(h, w);
      const large = Math.max(h, w);
      if (small < 2 || large < 3) {
        setDimError('Minimum size is 2 × 3 inches (either 2×3 or 3×2).');
        setTotal(0);
        return;
      }
      setDimError(null);
    } else {
      setDimError(null);
    }

    let price = 0;
    const qty = parseInt(quantity) || 1;
    let area = 1;

    if (selectedVariant && requiresDimensions) {
      const w = parseFloat(width) || 0;
      const h = parseFloat(height) || 0;
      area = w * h;
      if (area === 0) area = 1;
      const unitPrice =
        qty >= 10
          ? selectedVariant.wholesale_price || selectedVariant.retail_price || 0
          : selectedVariant.retail_price || 0;
      price = unitPrice * area * qty;
    } else if (selectedVariant) {
      const unitPrice =
        qty >= 10
          ? selectedVariant.wholesale_price || selectedVariant.retail_price || 0
          : selectedVariant.retail_price || 0;
      price = unitPrice * qty;
    }

    if (!hasFile) price += 150;
    // Eyelets fee for Solvent Tarp: 1 PHP per eyelet × qty
    if (isSolventTarp) {
      const e = parseInt(eyelets) || 0;
      price += e * 1 * qty;
    }
    setTotal(price);
  }, [selectedVariant, quantity, width, height, hasFile, requiresDimensions, isSolventTarp, eyelets]);

  return { total, dimError, dimWarning };
};

export default useOrderCalculation;
