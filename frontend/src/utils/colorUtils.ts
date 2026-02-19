/**
 * Utility for generating stable HSL colors from advertiser names.
 * HSL is used for better compatibility with legacy tools like html2canvas.
 */
export const generateBrandColor = (name: string | undefined): string => {
    if (!name) return 'hsl(210, 70%, 50%)'; // Default Nasmedia Blue-ish

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Map hash to a hue between 0 and 360
    const hue = Math.abs(hash % 360);

    // Using HSL: H=Generated Hue, S=70%, L=50%
    return `hsl(${hue}, 70%, 50%)`;
};
