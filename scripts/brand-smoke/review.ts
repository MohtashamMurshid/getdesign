export type HumanReviewRating = {
  brand: string;
  url: string;
  primaryColorsCorrect: boolean | null;
  notes: string;
};

export type HumanReviewFile = {
  criterion: string;
  requiredCorrect: number;
  ratings: HumanReviewRating[];
};

export function createHumanReviewTemplate(
  results: ReadonlyArray<{ brand: string; url: string }>,
): HumanReviewFile {
  return {
    criterion:
      "Judge whether the generated palette's primary colors match the live brand.",
    requiredCorrect: 18,
    ratings: results.map((result) => ({
      brand: result.brand,
      url: result.url,
      primaryColorsCorrect: null,
      notes: "",
    })),
  };
}

export function evaluateHumanReview(review: HumanReviewFile) {
  const expectedTotal = 20;
  const duplicateBrands =
    review.ratings.length -
    new Set(review.ratings.map((rating) => rating.brand)).size;
  const pending = review.ratings.filter(
    (rating) => rating.primaryColorsCorrect === null,
  ).length;
  const correct = review.ratings.filter(
    (rating) => rating.primaryColorsCorrect === true,
  ).length;
  const complete =
    review.ratings.length === expectedTotal &&
    duplicateBrands === 0 &&
    pending === 0;

  return {
    total: review.ratings.length,
    correct,
    incorrect: review.ratings.length - correct - pending,
    pending,
    duplicateBrands,
    requiredCorrect: 18,
    complete,
    pass: complete && correct >= 18,
  };
}
