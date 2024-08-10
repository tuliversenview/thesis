export const getColorStyle = (percent) => {
    if (percent >= 0 && percent <= 33) {
      return { backgroundColor: 'green' };
    } else if (percent > 33 && percent <= 80) {
      return { backgroundColor: 'orange' };
    } else if (percent > 80 && percent <= 100) {
      return { backgroundColor: 'red' };
    } else {
      return {}; // Default or fallback style
    }
  };