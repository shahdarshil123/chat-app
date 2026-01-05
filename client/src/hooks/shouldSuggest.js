export function shouldSuggest(input) {
    if (!input) return false;
    if (input.length < 4) return false;

    // Sentence already complete
    if (/[.!?]\s*$/.test(input)) return false;

    return true;
}
