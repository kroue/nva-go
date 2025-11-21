import { useEffect, useMemo, useState } from 'react';

const parseNum = (v) => {
  const n = parseFloat(String(v ?? '').toString().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

const useOrderCalculation = (selectedVariant, quantity, width, height, hasFile, requiresDimensions, isSolventTarp, eyelets) => {
  const [dimError, setDimError] = useState(null);
  const [dimWarning, setDimWarning] = useState('');

  const total = useMemo(() => {
    if (!selectedVariant) return 0;

    const basePrice = selectedVariant.retail_price || selectedVariant.price || 0;
    const qty = parseInt(quantity) || 1;

    // For products requiring dimensions (Solvent Tarp, Sintraboard)
    if (requiresDimensions && width && height) {
      const widthNum = parseFloat(width) || 0;
      const heightNum = parseFloat(height) || 0;
      const area = widthNum * heightNum; // square feet
      let calculatedTotal = area * basePrice * qty;

      // Add eyelet cost for Solvent Tarp (1 peso per eyelet)
      if (isSolventTarp) {
        const eyeletCount = parseInt(eyelets) || 0;
        calculatedTotal += eyeletCount * 1;
      }

      return calculatedTotal;
    }

    // For regular products: price x quantity
    return basePrice * qty;
  }, [selectedVariant, quantity, width, height, requiresDimensions, isSolventTarp, eyelets]);

  useEffect(() => {
    // LIVE WARNING: runs on every change to width/height
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);

      if (!width || !height) {
        setDimWarning('Please enter both width and height for accurate pricing.');
        return;
      }

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

    // PRICE + FORM VALIDATION
    if (requiresDimensions) {
      const h = parseNum(height);
      const w = parseNum(width);
      if (!Number.isFinite(h) || !Number.isFinite(w)) {
        setDimError(null);
        return;
      }
      const small = Math.min(h, w);
      const large = Math.max(h, w);
      if (small < 2 || large < 3) {
        setDimError('Minimum size is 2 × 3 inches (either 2×3 or 3×2).');
        return;
      }
      setDimError(null);
    } else {
      setDimError(null);
    }
  }, [height, width, requiresDimensions]);

  return { total, dimError, dimWarning };
};

export default useOrderCalculation;
