import YearReviewClient from "./YearReviewClient";

export default function YearReviewPage({ params }: { params: { year: string } }) {
  const year = parseInt(params.year, 10);
  return <YearReviewClient year={year} />;
}
